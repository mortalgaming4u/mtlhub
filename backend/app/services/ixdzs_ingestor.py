import logging
import re
import time
import requests
from bs4 import BeautifulSoup
from typing import List, Tuple

from .novel_ingestor import NovelIngestor
from app.models.novel import Novel, Chapter
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)

class IxdzsIngestor(NovelIngestor):
    """
    Ingestor for ixdzs.tw novels.
    Overrides metadata, chapter-list extraction, and supplies a full ingest_novel.
    """

    SUPPORTED_DOMAIN = "ixdzs.tw"

    def __init__(self, db, service_role_key: str):
        super().__init__(db, service_role_key)

    def extract_metadata(self, soup: BeautifulSoup, url: str) -> dict:
        title_el = soup.select_one("div.book-info h1")
        author_el = soup.select_one("div.book-info .author a")
        count_el = soup.select_one("div.book-stats .chapters")

        if not title_el:
            logger.warning(f"[ixdzs] Missing title element at {url}")
        if not author_el:
            logger.warning(f"[ixdzs] Missing author element at {url}")
        if not count_el:
            logger.warning(f"[ixdzs] Missing chapter count element at {url}")

        title = title_el.get_text(strip=True) if title_el else "Unknown"
        author = author_el.get_text(strip=True) if author_el else "Unknown"
        count_text = count_el.get_text(strip=True) if count_el else ""
        total_chapters = int(re.sub(r"\D+", "", count_text) or 0)

        return {
            "title": title[:255],
            "author": author[:100],
            "cover_url": None,
            "total_chapters": total_chapters,
            "source_url": url[:500],
        }

    def get_chapter_urls(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract all chapter links in reading order."""
        links = soup.select("ul.chapter-list li a")
        urls = []
        for a in links:
            href = a.get("href")
            if not href:
                continue
            if href.startswith("/"):
                href = f"https://{self.SUPPORTED_DOMAIN}{href}"
            urls.append(href)
        return urls

    def fetch_chapter_content(self, url: str) -> Tuple[str, str]:
        soup = self.fetch_html(url)
        title_el = soup.select_one("div.chapter-title h1")
        if not title_el:
            logger.warning(f"[ixdzs] Missing chapter title at {url}")
        chapter_title = title_el.get_text(strip=True) if title_el else "Chapter"

        content_div = soup.select_one("div.read-content")
        if not content_div:
            logger.warning(f"[ixdzs] Missing chapter content at {url}")
        paras = content_div.find_all("p") if content_div else []
        body = "\n".join(p.get_text(strip=True) for p in paras)

        return chapter_title[:255], body

    def ingest_novel(self, url: str, limit: int = None) -> dict:
        """
        Full ingestion: metadata + chapter loop + DB writes + commit.
        """
        logger.info(f"Begin ixdzs ingestion: {url}")
        soup = self.fetch_html(url)
        meta = self.extract_metadata(soup, url)

        existing = (
            self.db.query(Novel)
            .filter(Novel.source_url == meta["source_url"])
            .first()
        )
        if existing:
            return {"status": "exists", "novel_id": existing.id}

        novel = Novel(**meta)
        self.db.add(novel)
        self.db.flush()

        chapter_urls = self.get_chapter_urls(soup, url)
        if limit:
            chapter_urls = chapter_urls[:limit]

        ingested = 0
        for chap_url in chapter_urls:
            try:
                chap_title, chap_body = self.fetch_chapter_content(chap_url)
                chapter = Chapter(
                    novel_id=novel.id,
                    title=chap_title,
                    content=chap_body,
                    source_url=chap_url[:500],
                )
                self.db.add(chapter)
                ingested += 1
                time.sleep(0.2)  # pacing
            except IntegrityError:
                self.db.rollback()
                logger.warning(f"Duplicate chapter skipped: {chap_url}")
            except Exception as e:
                logger.error(f"Failed to fetch {chap_url}: {e}")

        self.db.commit()
        return {
            "status": "success",
            "novel_id": novel.id,
            "chapters_ingested": ingested,
        }
