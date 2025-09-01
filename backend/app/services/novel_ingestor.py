# backend/app/services/novel_ingestor.py

import requests
from bs4 import BeautifulSoup
import re
import time
import logging

from urllib.parse import urlparse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)

def get_ingestor(db: Session, service_role_key: str, url: str):
    """
    Return the correct ingestor based on the URL's domain.
    Dynamically imports domain-specific classes to avoid circular imports.
    """
    hostname = urlparse(url).netloc.lower()

    if hostname.endswith("ixdzs.tw"):
        from .ixdzs_ingestor import IxdzsIngestor
        return IxdzsIngestor(db, service_role_key)

    # add more domains here with similar dynamic imports...

    return NovelIngestor(db, service_role_key)


class NovelIngestor:
    """
    Generic ingestor for unsupported domains.
    Handles metadata extraction, chapter loops, DB writes, and error handling.
    """

    def __init__(self, db: Session, service_role_key: str):
        self.db = db
        self.service_role_key = service_role_key

    def fetch_html(self, url: str) -> BeautifulSoup:
        headers = {
            "User-Agent": "Mozilla/5.0",
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
        # Generic metadata via OpenGraph
        meta_title = soup.find("meta", property="og:title")
        title = meta_title["content"][:255] if meta_title else "Unknown"

        return {
            "title": title,
            "author": "Unknown",
            "cover_url": None,
            "total_chapters": 0,
            "source_url": url[:500],
        }

    def fetch_chapter_content(self, url: str) -> tuple[str, str]:
        # Generic fallback: grab all <p> text
        soup = self.fetch_html(url)
        paras = soup.find_all("p")
        text = "\n".join(p.get_text(strip=True) for p in paras)
        return "Chapter", text

    def ingest_novel(self, url: str, limit: int = 5) -> dict:
        """
        Main orchestration:
         1) fetch_html listing page
         2) extract_metadata
         3) loop chapters (calls fetch_chapter_content)
         4) write Novel + Chapter to DB
         5) commit & return status dict
        """
        from app.models.novel import Novel, Chapter

        logger.info(f"Starting generic ingestion: {url}")
        soup = self.fetch_html(url)
        meta = self.extract_metadata(soup, url)

        existing = (
            self.db.query(Novel)
            .filter(Novel.source_url == meta["source_url"])
            .first()
        )
        if existing:
            return {"status": "exists", "novel_id": existing.id}

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
        # A real generic ingestor wouldn’t know chapter URLs – so skip or raise
        self.db.commit()
        return {"status": "success", "novel_id": novel.id, "chapters_ingested": ingested}
