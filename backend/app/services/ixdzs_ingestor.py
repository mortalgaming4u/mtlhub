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

    def fetch_html(self, url: str) -> BeautifulSoup:
        """Override to handle Chinese encoding properly."""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Handle Chinese encoding
            if response.encoding == 'ISO-8859-1':
                response.encoding = 'utf-8'
            
            soup = BeautifulSoup(response.content, 'html.parser', from_encoding=response.encoding)
            return soup
            
        except requests.RequestException as e:
            logger.error(f"[ixdzs] Failed to fetch {url}: {e}")
            raise

    def extract_metadata(self, soup: BeautifulSoup, url: Union[str, HttpUrl]) -> dict:
        """Extract novel metadata from the main page."""
        url_str = str(url)

        # Extract title from h1 or page title
        title = "Unknown"
        title_el = soup.find('h1')
        if title_el:
            title = title_el.get_text(strip=True)
        else:
            # Fallback to title tag
            title_tag = soup.find('title')
            if title_tag:
                title_text = title_tag.get_text(strip=True)
                # Remove site suffix
                title = re.sub(r'_.*', '', title_text).strip()

        # Extract author - look for "作者:" pattern
        author = "Unknown"
        page_text = soup.get_text()
        author_match = re.search(r'作者[：:]\s*([^\n\r]+)', page_text)
        if author_match:
            author = author_match.group(1).strip()

        # Extract total chapters from "共X章" pattern
        total_chapters = 0
        chapter_match = re.search(r'共(\d+)章', page_text)
        if chapter_match:
            total_chapters = int(chapter_match.group(1))

        logger.info(f"[ixdzs] Extracted metadata - Title: {title}, Author: {author}, Chapters: {total_chapters}")

        return {
            "title": title[:255],
            "author": author[:100],
            "cover_url": None,
            "total_chapters": total_chapters,
            "source_url": url_str[:500],
        }

    def get_chapter_urls(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract all chapter URLs from the page."""
        urls = []
        
        # Extract novel ID from URL
        novel_id_match = re.search(r'/read/(\d+)/', base_url)
        if not novel_id_match:
            logger.error(f"[ixdzs] Could not extract novel ID from URL: {base_url}")
            return urls
        
        novel_id = novel_id_match.group(1)
        logger.info(f"[ixdzs] Extracting chapters for novel ID: {novel_id}")

        # From the provided HTML content, I can see the structure:
        # The chapters are listed in the "目錄" (Table of Contents) section
        # Each chapter is a link like "第1696章 突如其來的動靜"
        
        # Look for chapter links in the content
        # Pattern: "第X章" followed by chapter title
        page_text = soup.get_text()
        
        # Extract chapter information from the content
        # Based on the file content, chapters are listed as:
        # - 第1696章 突如其來的動靜
        # - 第1695章 同階一戰
        # etc.
        
        chapter_pattern = r'第(\d+)章\s+([^\n\r]+)'
        chapter_matches = re.findall(chapter_pattern, page_text)
        
        if not chapter_matches:
            # Try to find chapter links directly
            chapter_links = soup.find_all('a', href=re.compile(r'/p\d+\.html'))
            for link in chapter_links:
                href = link.get('href')
                if href:
                    if href.startswith('/'):
                        full_url = f"https://{self.SUPPORTED_DOMAIN}{href}"
                    else:
                        full_url = href
                    urls.append(full_url)
        else:
            # Generate URLs from chapter numbers
            for chapter_num, chapter_title in chapter_matches:
                chapter_url = f"https://{self.SUPPORTED_DOMAIN}/read/{novel_id}/p{chapter_num}.html"
                urls.append(chapter_url)

        # If still no URLs found, try to construct from available information
        if not urls and chapter_matches:
            # Use the first and last chapter numbers to generate range
            first_chapter = int(chapter_matches[-1][0])  # Chapters are in reverse order
            last_chapter = int(chapter_matches[0][0])
            
            logger.info(f"[ixdzs] Generating URLs for chapters {first_chapter} to {last_chapter}")
            
            for i in range(first_chapter, last_chapter + 1):
                chapter_url = f"https://{self.SUPPORTED_DOMAIN}/read/{novel_id}/p{i}.html"
                urls.append(chapter_url)

        logger.info(f"[ixdzs] Found {len(urls)} chapter URLs")
        return urls

    def fetch_chapter_content(self, url: str) -> Tuple[str, str]:
        """Fetch chapter title and content from a chapter URL."""
        try:
            soup = self.fetch_html(url)
        except Exception as e:
            logger.error(f"[ixdzs] Failed to fetch chapter {url}: {e}")
            return "Unknown Chapter", ""

        # Extract chapter title
        chapter_title = "Unknown Chapter"
        
        # Try h1 first
        title_el = soup.find('h1')
        if title_el:
            chapter_title = title_el.get_text(strip=True)
        else:
            # Try title tag and extract chapter info
            title_tag = soup.find('title')
            if title_tag:
                title_text = title_tag.get_text(strip=True)
                # Extract chapter title from page title
                chapter_match = re.search(r'(第\d+章[^_]+)', title_text)
                if chapter_match:
                    chapter_title = chapter_match.group(1).strip()

        # Extract chapter content
        content_parts = []
        
        # Common selectors for chapter content on Chinese novel sites
        content_selectors = [
            '.content',
            '#content', 
            '.chapter-content',
            '.read-content',
            '.txt',
            'div[id*="content"]',
            'div[class*="content"]',
            '.novel-content',
            '#novel-content'
        ]
        
        for selector in content_selectors:
            content_div = soup.select_one(selector)
            if content_div:
                # Remove script tags and other unwanted elements
                for unwanted in content_div(['script', 'style', 'nav', 'header', 'footer']):
                    unwanted.decompose()
                
                # Get all paragraphs
                paras = content_div.find_all('p')
                if paras:
                    content_parts = [p.get_text(strip=True) for p in paras if p.get_text(strip=True)]
                else:
                    # Get all text if no paragraphs
                    text = content_div.get_text(strip=True)
                    if text:
                        # Split by double newlines to create paragraphs
                        content_parts = [p.strip() for p in text.split('\n\n') if p.strip()]
                break

        # If no content found with selectors, try to extract from page text
        if not content_parts:
            page_text = soup.get_text()
            # Try to find content after chapter title
            title_pattern = r'第\d+章[^\n]*\n+(.*?)(?=第\d+章|$)'
            content_match = re.search(title_pattern, page_text, re.DOTALL)
            if content_match:
                content_text = content_match.group(1).strip()
                content_parts = [p.strip() for p in content_text.split('\n\n') if p.strip()]

        body = '\n\n'.join(content_parts) if content_parts else ""
        
        logger.info(f"[ixdzs] Chapter: {chapter_title[:50]}..., Content length: {len(body)}")
        
        return chapter_title[:255], body

    def ingest_novel(self, url: Union[str, HttpUrl], limit: int = None) -> dict:
        """
        Full ingestion: metadata + chapter loop + DB writes + commit.
        """
        url_str = str(url)
        logger.info(f"[ixdzs] Begin ingestion: {url_str}")

        try:
            # 1) Fetch listing page
            soup = self.fetch_html(url_str)

            # 2) Extract metadata
            meta = self.extract_metadata(soup, url_str)

            # 3) Check for existing novel
            existing = (
                self.db.query(Novel)
                .filter(Novel.source_url == meta["source_url"])
                .first()
            )
            if existing:
                logger.info(f"[ixdzs] Novel already exists: {existing.id}")
                return {
                    "status": "exists", 
                    "novel_id": existing.id,
                    "chapters_ingested": 0
                }

            # 4) Create novel record
            novel = Novel(**meta)
            self.db.add(novel)
            self.db.flush()
            logger.info(f"[ixdzs] Created novel record: {novel.id}")

            # 5) Gather chapter URLs
            chapter_urls = self.get_chapter_urls(soup, url_str)
            if not chapter_urls:
                logger.warning(f"[ixdzs] No chapters found for {url_str}")
                return {
                    "status": "warning", 
                    "message": "No chapters found", 
                    "novel_id": novel.id,
                    "chapters_ingested": 0
                }
                
            if limit:
                chapter_urls = chapter_urls[:limit]
                logger.info(f"[ixdzs] Limited to {limit} chapters")

            logger.info(f"[ixdzs] Processing {len(chapter_urls)} chapters")

            # 6) Loop and save each chapter
            ingested = 0
            failed = 0
            
            for i, chap_url in enumerate(chapter_urls, 1):
                try:
                    logger.info(f"[ixdzs] Processing chapter {i}/{len(chapter_urls)}: {chap_url}")
                    chap_title, chap_body = self.fetch_chapter_content(chap_url)
                    
                    if not chap_body or len(chap_body) < 50:  # Skip very short chapters
                        logger.warning(f"[ixdzs] Skipping chapter with insufficient content: {chap_url}")
                        failed += 1
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
                        except Exception as commit_error:
                            self.db.rollback()
                            logger.error(f"[ixdzs] Failed to commit chapters: {commit_error}")
                            break
                    
                    # Be respectful to the server
                    time.sleep(0.5)
                    
                except IntegrityError as ie:
                    self.db.rollback()
                    logger.warning(f"[ixdzs] Duplicate chapter skipped: {chap_url}")
                    failed += 1
                except Exception as e:
                    logger.error(f"[ixdzs] Failed to fetch chapter {chap_url}: {e}")
                    failed += 1
                    continue

            # 7) Final commit
            try:
                self.db.commit()
                logger.info(f"[ixdzs] Final commit completed")
            except Exception as e:
                self.db.rollback()
                logger.error(f"[ixdzs] Failed final commit: {e}")
                return {
                    "status": "error", 
                    "message": f"Failed to save chapters: {e}", 
                    "novel_id": novel.id,
                    "chapters_ingested": ingested
                }

            # 8) Update novel stats
            try:
                novel.total_chapters = ingested
                self.db.commit()
            except Exception as e:
                logger.warning(f"[ixdzs] Failed to update novel stats: {e}")

            logger.info(f"[ixdzs] Ingestion completed - Novel: {novel.id}, Ingested: {ingested}, Failed: {failed}")

            return {
                "status": "success",
                "novel_id": novel.id,
                "chapters_ingested": ingested,
                "total_chapters_found": len(chapter_urls),
                "failed_chapters": failed
            }
            
        except Exception as e:
            logger.error(f"[ixdzs] Ingestion failed: {e}")
            self.db.rollback()
            return {
                "status": "error",
                "message": str(e),
                "chapters_ingested": 0
            }
