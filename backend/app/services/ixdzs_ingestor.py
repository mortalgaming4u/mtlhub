# backend/app/services/ixdzs_ingestor.py

import logging
import re
import time
from typing import List, Tuple, Union

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

    def extract_metadata(self, soup: BeautifulSoup, url: Union[str, HttpUrl]) -> dict:
        # Always work with a plain string
        url_str = str(url)

        # Extract title - looks for h1 in the page
        title_el = soup.select_one("h1") or soup.select_one("title")
        title = title_el.get_text(strip=True) if title_el else "Unknown"
        
        # Extract author - look for author information
        author_el = soup.select_one(".author") or soup.find(text=re.compile("作者"))
        if author_el:
            if hasattr(author_el, 'get_text'):
                author = author_el.get_text(strip=True)
            else:
                # If it's a text node, get the parent and extract author
                author_parent = author_el.parent if hasattr(author_el, 'parent') else None
                if author_parent:
                    author_text = author_parent.get_text(strip=True)
                    author_match = re.search(r"作者[：:]\s*(.+)", author_text)
                    author = author_match.group(1) if author_match else "Unknown"
                else:
                    author = "Unknown"
        else:
            author = "Unknown"

        # Extract chapter count from the text content
        page_text = soup.get_text()
        chapter_match = re.search(r"共(\d+)章", page_text)
        total_chapters = int(chapter_match.group(1)) if chapter_match else 0

        logger.info(f"[ixdzs] Extracted - Title: {title}, Author: {author}, Chapters: {total_chapters}")

        return {
            "title": title[:255],
            "author": author[:100],
            "cover_url": None,
            "total_chapters": total_chapters,
            "source_url": url_str[:500],
        }

    def get_chapter_urls(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract all chapter links in reading order."""
        logger.info(f"[ixdzs] Looking for chapters in {base_url}")
        
        # Try multiple possible selectors for chapter links
        possible_selectors = [
            "a[href*='/p']",  # Links containing '/p' (chapter pattern)
            ".chapter-list a",
            ".catalog a",
            ".mulu a", 
            "ul li a",
            "a[href*='548591']"  # Links containing the novel ID
        ]
        
        urls = []
        for selector in possible_selectors:
            links = soup.select(selector)
            logger.info(f"[ixdzs] Selector '{selector}' found {len(links)} potential links")
            
            for a in links:
                href = a.get("href")
                if not href:
                    continue
                    
                # Skip non-chapter links
                if not self._is_chapter_url(href):
                    continue
                    
                if href.startswith("/"):
                    href = f"https://{self.SUPPORTED_DOMAIN}{href}"
                elif not href.startswith("http"):
                    href = f"https://{self.SUPPORTED_DOMAIN}/{href}"
                    
                if href not in urls:  # Avoid duplicates
                    urls.append(href)
            
            if urls:  # If we found chapters with this selector, use them
                break
        
        # If no chapters found in the main page, try to find chapter list page
        if not urls:
            catalog_links = soup.select("a[href*='catalog'], a[href*='mulu'], a[href*='chapter']")
            for link in catalog_links:
                catalog_url = link.get("href")
                if catalog_url:
                    if catalog_url.startswith("/"):
                        catalog_url = f"https://{self.SUPPORTED_DOMAIN}{catalog_url}"
                    try:
                        catalog_soup = self.fetch_html(catalog_url)
                        urls = self.get_chapter_urls(catalog_soup, catalog_url)
                        if urls:
                            break
                    except Exception as e:
                        logger.warning(f"[ixdzs] Failed to fetch catalog page {catalog_url}: {e}")
        
        logger.info(f"[ixdzs] Found {len(urls)} chapter URLs")
        return urls

    def _is_chapter_url(self, url: str) -> bool:
        """Check if a URL looks like a chapter URL."""
        # For ixdzs.tw, chapter URLs typically contain '/p' followed by numbers
        if "/p" in url and re.search(r"/p\d+", url):
            return True
        # Also accept URLs with chapter numbers
        if re.search(r"(chapter|ch|第)\d+", url, re.I):
            return True
        return False

    def fetch_chapter_content(self, url: str) -> Tuple[str, str]:
        """Fetch chapter title and content from a chapter URL."""
        try:
            soup = self.fetch_html(url)
        except Exception as e:
            logger.error(f"[ixdzs] Failed to fetch chapter {url}: {e}")
            return "Unknown Chapter", ""

        # Extract chapter title - try multiple selectors
        title_selectors = [
            "h1", 
            ".chapter-title", 
            ".chapter-name",
            ".title",
            "title"
        ]
        
        chapter_title = "Unknown Chapter"
        for selector in title_selectors:
            title_el = soup.select_one(selector)
            if title_el:
                title_text = title_el.get_text(strip=True)
                # Clean up the title
                title_text = re.sub(r"^.*?第\d+章\s*", "", title_text)  # Remove novel name prefix
                if title_text and len(title_text) > 3:  # Make sure it's not just empty or too short
                    chapter_title = title_text
                    break

        # Extract chapter content - try multiple selectors
        content_selectors = [
            ".content",
            ".chapter-content", 
            ".read-content",
            "#content",
            ".txt",
            "div[id*='content']",
            "div[class*='content']"
        ]
        
        content_parts = []
        for selector in content_selectors:
            content_div = soup.select_one(selector)
            if content_div:
                # Get all paragraphs or just the text
                paras = content_div.find_all("p")
                if paras:
                    content_parts = [p.get_text(strip=True) for p in paras if p.get_text(strip=True)]
                else:
                    text = content_div.get_text(strip=True)
                    if text:
                        content_parts = [text]
                break
        
        # If no content found with selectors, get all text content and filter
        if not content_parts:
            all_text = soup.get_text()
            # Try to find content after common chapter title patterns
            content_match = re.search(r"第\d+章.*?\n\n(.+)", all_text, re.DOTALL)
            if content_match:
                content_parts = [content_match.group(1).strip()]

        body = "\n".join(content_parts) if content_parts else ""
        
        logger.info(f"[ixdzs] Extracted chapter - Title: {chapter_title[:50]}..., Content length: {len(body)}")
        
        return chapter_title[:255], body

    def ingest_novel(self, url: Union[str, HttpUrl], limit: int = None) -> dict:
        """
        Full ingestion: metadata + chapter loop + DB writes + commit.
        """
        url_str = str(url)
        logger.info(f"Begin ixdzs ingestion: {url_str}")

        # 1) Fetch listing page
        try:
            soup = self.fetch_html(url_str)
        except Exception as e:
            logger.error(f"[ixdzs] Failed to fetch main page {url_str}: {e}")
            return {"status": "error", "message": f"Failed to fetch page: {e}"}

        # 2) Extract metadata
        meta = self.extract_metadata(soup, url_str)

        # 3) Check for existing novel
        existing = (
            self.db.query(Novel)
            .filter(Novel.source_url == meta["source_url"])
            .first()
        )
        if existing:
            return {"status": "exists", "novel_id": existing.id}

        # 4) Create novel record
        novel = Novel(**meta)
        self.db.add(novel)
        try:
            self.db.flush()
        except Exception as e:
            self.db.rollback()
            logger.error(f"[ixdzs] Failed to create novel record: {e}")
            return {"status": "error", "message": f"Failed to create novel: {e}"}

        # 5) Gather chapter URLs
        chapter_urls = self.get_chapter_urls(soup, url_str)
        if not chapter_urls:
            logger.warning(f"[ixdzs] No chapters found for {url_str}")
            return {"status": "warning", "message": "No chapters found", "novel_id": novel.id}
            
        if limit:
            chapter_urls = chapter_urls[:limit]

        logger.info(f"[ixdzs] Processing {len(chapter_urls)} chapters")

        # 6) Loop and save each chapter
        ingested = 0
        for i, chap_url in enumerate(chapter_urls, 1):
            try:
                logger.info(f"[ixdzs] Processing chapter {i}/{len(chapter_urls)}: {chap_url}")
                chap_title, chap_body = self.fetch_chapter_content(chap_url)
                
                if not chap_body:
                    logger.warning(f"[ixdzs] Empty content for chapter {chap_url}")
                    continue
                
                chapter = Chapter(
                    novel_id=novel.id,
                    title=chap_title,
                    content=chap_body,
                    source_url=chap_url[:500],
                    chapter_number=i
                )
                self.db.add(chapter)
                ingested += 1
                
                # Commit every 10 chapters to avoid memory issues
                if ingested % 10 == 0:
                    try:
                        self.db.commit()
                        logger.info(f"[ixdzs] Committed {ingested} chapters so far")
                    except Exception as e:
                        self.db.rollback()
                        logger.error(f"[ixdzs] Failed to commit chapters: {e}")
                        break
                
                time.sleep(0.5)  # Be respectful to the server
                
            except IntegrityError:
                self.db.rollback()
                logger.warning(f"[ixdzs] Duplicate chapter skipped: {chap_url}")
            except Exception as e:
                logger.error(f"[ixdzs] Failed to fetch chapter {chap_url}: {e}")
                continue

        # 7) Final commit
        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error(f"[ixdzs] Failed final commit: {e}")
            return {"status": "error", "message": f"Failed to save chapters: {e}", "novel_id": novel.id}

        return {
            "status": "success",
            "novel_id": novel.id,
            "chapters_ingested": ingested,
            "total_chapters_found": len(chapter_urls)
        }
