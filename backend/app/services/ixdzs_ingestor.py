import logging
from typing import List, Dict

import requests
from bs4 import BeautifulSoup

from .base import NovelIngestor, IngestResult

logger = logging.getLogger(__name__)

class IxdzsIngestor(NovelIngestor):
    """
    Ingestor for ixdzs.tw novels.
    Endpoint pattern: https://ixdzs.tw/read/{novel_id}/
    """

    SUPPORTED_DOMAIN = "ixdzs.tw"

    def fetch_html(self, url: str) -> BeautifulSoup:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/115.0.0.0 Safari/537.36"
            ),
            "Referer": "https://ixdzs.tw/",
            "Accept-Language": "zh-CN,zh;q=0.9",
        }
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding or "utf-8"
        return BeautifulSoup(resp.text, "html5lib")

    def parse_metadata(self, soup: BeautifulSoup) -> Dict:
        # Adjust selectors if the real page structure differs
        title = soup.select_one("div.book-info h1").get_text(strip=True)
        author = soup.select_one("div.book-info .author a").get_text(strip=True)
        status = soup.select_one("div.book-info .status").get_text(strip=True)
        chapter_count = int(
            soup.select_one("div.book-stats .chapters").get_text(strip=True)
        )
        return {
            "title": title,
            "author": author,
            "status": status,
            "chapter_count": chapter_count,
        }

    def get_chapter_list(self, soup: BeautifulSoup) -> List[Dict]:
        chapters = []
        # Each chapter link typically under a <ul class="chapter-list">
        for link in soup.select("ul.chapter-list li > a"):
            href = link["href"]
            # Normalize to absolute URL
            url = href if href.startswith("http") else f"https://ixdzs.tw{href}"
            # Extract chapter number from URL tail
            num_str = url.rstrip("/").split("/")[-1]
            chapters.append({"number": int(num_str), "url": url})
        return chapters

    def fetch_chapter(self, url: str) -> str:
        soup = self.fetch_html(url)
        # The actual text container may differ; adjust as needed
        content_div = soup.select_one("div.read-content")
        paras = content_div.find_all("p")
        return "\n".join(p.get_text(strip=True) for p in paras)

    def ingest(self, url: str) -> IngestResult:
        """
        Override ingest to tie it all together.
        BaseIngestor.ingest may already handle this, so call super().
        """
        return super().ingest(url)
