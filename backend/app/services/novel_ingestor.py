# backend/app/services/novel_ingestor.py

import requests
from bs4 import BeautifulSoup
import re
import time
import logging

from urllib.parse import urlparse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# Import your domain‐specific ingestor
from .ixdzs_ingestor import IxdzsIngestor

logger = logging.getLogger(__name__)

# Map hostname suffixes to their Ingestor classes
DOMAIN_INGESTORS = {
    "ixdzs.tw": IxdzsIngestor,
}


def get_ingestor(db: Session, service_role_key: str, url: str):
    """
    Return an instance of the appropriate ingestor based on the URL's domain.
    Falls back to the generic NovelIngestor if no match is found.
    """
    hostname = urlparse(url).netloc.lower()
    for domain_suffix, ingestor_cls in DOMAIN_INGESTORS.items():
        if hostname.endswith(domain_suffix):
            return ingestor_cls(db, service_role_key)

    return NovelIngestor(db, service_role_key)


class NovelIngestor:
    """
    Handles ingestion of novel metadata and chapters from external sources.
    Requires a SQLAlchemy DB session and a Supabase service role key.
    """

    def __init__(self, db: Session, service_role_key: str):
        self.db = db
        self.service_role_key = service_role_key

    def fetch_html(self, url: str) -> BeautifulSoup:
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://ixdzs.tw/",
            "Accept-Language": "zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3",
        }
        try:
            resp = requests.get(url, headers=headers, timeout=30)
            resp.raise_for_status()
            resp.encoding = resp.apparent_encoding or "utf-8"
            return BeautifulSoup(resp.text, "html5lib")
        except Exception as e:
            logger.error(f"fetch_html failed for {url}: {e}")
            raise

    def extract_metadata(self, soup: BeautifulSoup, url: str) -> dict:
        try:
            meta_title = soup.find("meta", property="og:novel:book_name")
            meta_author = soup.find("meta", property="og:novel:author")
            meta_image = soup.find("meta", property="og:image")
            meta_desc = soup.find("meta", {"name": "description"})

            title = meta_title["content"] if meta_title else "Unknown"
            author = meta_author["content"] if meta_author else "Unknown"
            cover = meta_image["content"] if meta_image else None

            total_chapters = 0
            if meta_desc:
                match = re.search(r"章節[：:]\s*(\d+)", meta_desc["content"])
                total_chapters = int(match.group(1)) if match else 0

            return {
                "title": title[:255],
                "author": author[:100],
                "cover_url": cover[:500] if cover else None,
                "total_chapters": total_chapters,
                "source_url": url[:500],
            }
        except Exception as e:
            logger.error(f"extract_metadata failed: {e}")
            raise

    def fetch_chapter_content(self, url: str) -> tuple[str, str]:
        try:
            soup = self.fetch_html(url)

            # Title extraction
            title = "Unknown Chapter"
            for el in soup.select("h1, title"):
                txt = el.get_text(strip=True)
                if txt:
                    title = re.sub(
                        r"[-|]爱下电子书.*$", "", txt
                    ).strip()
                    break

            # Content extraction
            content = ""
            page_div = soup.find("div", id="page") or soup.find("div", class_="read-content")
            if page_div:
                for bad in page_div.select("script, style, .ad, .advertisement"):
                    bad.decompose()

                raw = page_div.get_text("\n", strip=True)
                lines = [l.strip() for l in raw.split("\n") if l.strip()]
                filtered = [
                    l
                    for l in lines
                    if len(l) > 10
                    and not any(x in l for x in ["广告", "ADVERTISEMENT", "SPONSORED"])
                ]
                content = "\n".join(filtered)

            return title[:255], content
        except Exception as e:
            logger.error(f"fetch_chapter_content failed for {url}: {e}")
            return "Error Chapter", ""

    def ingest_novel(self, url: str, limit: int = 5) -> dict:
        try:
            logger.info(f"Starting ingestion: {url}")
            soup = self.fetch_html(url)
            meta = self.extract_metadata(soup, url)

            from app.models.novel import Novel, Chapter

            existing = (
                self.db.query(Novel)
                .filter(Novel.source_url == url)
                .first()
            )
            if existing:
                return {
                    "status": "exists",
                    "novel_id": existing.id,
                    "message": "Novel already exists",
                }

            novel = Novel(
                title=meta["title"],
                author=meta["author"],
                cover_url=meta["cover_url"],
                source_url=meta["source_url"],
                total_chapters=meta["total_chapters"],
            )
            self.db.add(novel)
            self.db.flush()

            ingested = 0
            for i in range(1, min(limit, meta["total_chapters"]) + 1):
                try:
                    chap_url = f"{url.rstrip('/')}/p{i}.html"
                    t, c = self.fetch_chapter_content(chap_url)

                    chapter = Chapter(
                        novel_id=novel.id,
                        chapter_number=i,
                        title=t,
                        original_content=c,
                        source_url=chap_url[:500],
                    )
                    self.db.add(chapter)
                    ingested += 1
                    time.sleep(1)
                except Exception:
                    continue

            self.db.commit()
            return {
                "status": "success",
                "novel_id": novel.id,
                "chapters_ingested": ingested,
            }

        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"DB integrity error: {e}")
            return {"status": "error", "message": "DB integrity error"}

        except Exception as e:
            self.db.rollback()
            logger.error(f"Unexpected error: {e}")
            return {"status": "error", "message": str(e)}
