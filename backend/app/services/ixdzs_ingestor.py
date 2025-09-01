# backend/app/services/ixdzs_ingestor.py

import logging
import re
import time
import requests
from bs4 import BeautifulSoup
from typing import Tuple

from .novel_ingestor import NovelIngestor

logger = logging.getLogger(__name__)

class IxdzsIngestor(NovelIngestor):
    """
    Ingestor for ixdzs.tw novels.
    Inherits the generic ingest_novel() flow from NovelIngestor.
    """

    SUPPORTED_DOMAIN = "ixdzs.tw"

    def __init__(self, db, service_role_key: str):
        super().__init__(db, service_role_key)

    def extract_metadata(self, soup: BeautifulSoup, url: str) -> dict:
        # Title & author
        title = soup.select_one("div.book-info h1").get_text(strip=True)
        author = soup.select_one("div.book-info .author a").get_text(strip=True)

        # Total chapters (strip out non-digits)
        count_text = soup.select_one("div.book-stats .chapters").get_text(strip=True)
        total_chapters = int(re.sub(r"\D+", "", count_text) or 0)

        return {
            "title": title[:255],
            "author": author[:100],
            "cover_url": None,               # no reliable selector
            "total_chapters": total_chapters,
            "source_url": url[:500],
        }

    def fetch_chapter_content(self, url: str) -> Tuple[str, str]:
        soup = self.fetch_html(url)

        # Chapter title
        title_el = soup.select_one("div.chapter-title h1")
        chapter_title = title_el.get_text(strip=True) if title_el else "Chapter"

        # Chapter body
        content_div = soup.select_one("div.read-content")
        paragraphs = content_div.find_all("p") if content_div else []
        body = "\n".join(p.get_text(strip=True) for p in paragraphs)

        return chapter_title[:255], body

    # No need to override ingest_novel(); inherited version will:
    # 1) fetch_html the listing page
    # 2) call extract_metadata()
    # 3) loop chapters 1..total_chapters, building URLs with `.fetch_chapter_content()`
    # 4) write Novel + Chapter rows and commit
