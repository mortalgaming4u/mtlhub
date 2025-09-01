import logging
import re
import time
from typing import List, Tuple, Union
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from pydantic import HttpUrl
from sqlalchemy.exc import IntegrityError

from .novel_ingestor import NovelIngestor
from app.models.novel import Novel, Chapter

logger = logging.getLogger(__name__)


class IxdzsIngestor(NovelIngestor):
    """
    Ingestor for ixdzs.tw novels.  
    Overrides metadata, chapter-list extraction, and supplies a full ingest_novel.
    """

    SUPPORTED_DOMAIN = "ixdzs.tw"

    def __init__(self, db, service_role_key: str):
        super().__init__(db, service_role_key)

    def fetch_html(self, url: str) -> BeautifulSoup:
        """Override to handle Chinese encoding properly."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                          " AppleWebKit/537.36 (KHTML, like Gecko)"
                          " Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;"
                      "q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
        }
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            # fallback to UTF-8 if garbled
            if not resp.encoding or resp.encoding.lower().startswith("iso-8859"):
                resp.encoding = "utf-8"
            soup = BeautifulSoup(resp.text, "html.parser")
            logger.info(f"[ixdzs] fetched {url}")
            return soup
        except Exception as e:
            logger.error(f"[ixdzs] fetch_html failed for {url}: {e}")
            raise

    def extract_metadata(
        self, soup: BeautifulSoup, url: Union[str, HttpUrl]
    ) -> dict:
        text = soup.get_text("\n")
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # Title
        title = next(
            (l for l in lines[:20]
             if len(l) > 2 and "ixdzs.tw" not in l),
            "Unknown"
        )

        # Author
        author = "Unknown"
        m = re.search(r"作者[:：]\s*([^\n\r]+)", text)
        if m:
            author = m.group(1).strip()

        # Total chapters
        total = 0
        m = re.search(r"共\s*(\d+)\s*章", text)
        if m:
            total = int(m.group(1))

        # Description parts
        desc_parts = []
        m = re.search(r"(\d+(?:\.\d+)?)萬字", text)
        if m:
            desc_parts.append(f"字數：{m.group(1)}萬字")
        m = re.search(r"(連載中|已完結)", text)
        if m:
            desc_parts.append(f"狀態：{m.group(1)}")
        m = re.search(r"更新[:：]\s*(\d{4}-\d{2}-\d{2}[^\\n]+)", text)
        if m:
            desc_parts.append(f"更新：{m.group(1).strip()}")

        description = " | ".join(desc_parts) if desc_parts else None

        logger.info(f"[ixdzs] metadata: title={title}, author={author}, total={total}")
        return {
            "title": title[:255],
            "author": author[:100],
            "cover_url": None,
            "total_chapters": total,
            "source_url": str(url)[:500],
            "description": description and description[:1000],
        }

    def get_chapter_urls(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """
        Pull every `/read/{novel_id}/pX.html` link on the page.
        """
        urls: List[str] = []

        # Extract novel ID from the listing URL
        m = re.search(r"/read/(\d+)", base_url)
        if not m:
            logger.error(f"[ixdzs] cannot extract novel_id from {base_url}")
            return urls
        novel_id = m.group(1)

        # Find <a> tags whose href ends in /p<digit+>.html
        pattern = re.compile(rf"/read/{novel_id}/p\d+\.html$")
        for a in soup.find_all("a", href=pattern):
            href = a["href"].strip()
            full = urljoin(base_url, href)
            urls.append(full)

        # Dedupe & sort by the chapter number
        unique = sorted(set(urls), key=lambda u: int(re.search(r"p(\d+)\.html$", u).group(1)))
        logger.info(f"[ixdzs] found {len(unique)} chapters")
        if unique:
            logger.debug(f"[ixdzs] sample urls: {unique[:3]} ... {unique[-3:]}")
        return unique

    def fetch_chapter_content(self, url: str) -> Tuple[str, str]:
        """
        Return (chapter_title, body_text).
        """
        try:
            soup = self.fetch_html(url)
            text = soup.get_text("\n")

            # Title: pull from <title>
            title_tag = soup.find("title")
            chap_title = title_tag.get_text().split("_")[0].strip() if title_tag else "Unknown Chapter"

            # Body: join all <p> tags
            paras = [p.get_text(strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
            if not paras:
                # fallback: split on newline
                paras = [ln.strip() for ln in text.splitlines() if ln.strip()]

            body = "\n\n".join(paras).strip()
            # too short? warn
            if len(paras) < 3:
                logger.warning(f"[ixdzs] very short chapter at {url} ({len(paras)} paras)")

            logger.info(f"[ixdzs] fetched chapter '{chap_title}' ({len(body)} chars)")
            return chap_title[:255], body
        except Exception as e:
            logger.error(f"[ixdzs] fetch_chapter_content failed for {url}: {e}")
            return "Unknown Chapter", ""

    def ingest_novel(self, url: Union[str, HttpUrl], limit: int = None) -> dict:
        """
        1) create novel row
        2) scrape all chapter URLs
        3) fetch + insert each chapter
        4) commit
        """
        url_str = str(url)
        logger.info(f"[ixdzs] ingest_novel start: {url_str}")

        # 1) listing page + metadata
        lst_soup = self.fetch_html(url_str)
        meta = self.extract_metadata(lst_soup, url_str)

        # 2) avoid duplicates
        existing = self.db.query(Novel).filter(Novel.source_url == meta["source_url"]).first()
        if existing:
            logger.info(f"[ixdzs] already exists: novel_id={existing.id}")
            return {"status": "exists", "novel_id": existing.id, "chapters_ingested": 0}

        # 3) create novel record
        novel = Novel(**meta)
        self.db.add(novel)
        self.db.flush()
        logger.info(f"[ixdzs] created novel id={novel.id}")

        # 4) chapter URLs
        chap_urls = self.get_chapter_urls(lst_soup, url_str)
        if not chap_urls:
            logger.warning(f"[ixdzs] no chapters found for {url_str}")
            self.db.commit()
            return {"status": "warning", "novel_id": novel.id, "chapters_ingested": 0}

        # 5) fetch & insert each chapter
        ingested = 0
        for idx, chap_url in enumerate(chap_urls, start=1):
            if limit and ingested >= limit:
                break

            title, body = self.fetch_chapter_content(chap_url)
            if not body:
                continue

            chapter = Chapter(
                novel_id=novel.id,
                title=title,
                content=body,
                order=idx,
                source_url=chap_url
            )
            self.db.add(chapter)
            ingested += 1

        # 6) commit all
        try:
            self.db.commit()
            logger.info(f"[ixdzs] committed {ingested} chapters for novel_id={novel.id}")
            return {"status": "success", "novel_id": novel.id, "chapters_ingested": ingested}
        except IntegrityError as ie:
            self.db.rollback()
            logger.error(f"[ixdzs] integrity error on commit: {ie}")
            return {"status": "error", "message": "duplicate chapter or db constraint failed"}
        except Exception as e:
            self.db.rollback()
            logger.error(f"[ixdzs] unknown error on commit: {e}")
            return {"status": "error", "message": str(e)}
