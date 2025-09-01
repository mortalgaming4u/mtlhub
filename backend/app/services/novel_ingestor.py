import requests
from bs4 import BeautifulSoup
import re
import time
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)

class NovelIngestor:
    def __init__(self, db: Session):
        self.db = db
        
    def fetch_html(self, url):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://ixdzs.tw/",
            "Accept-Language": "zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3",
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            response.encoding = response.apparent_encoding or 'utf-8'
            
            # Use html5lib parser for Termux compatibility
            return BeautifulSoup(response.text, "html5lib")
            
        except Exception as e:
            logger.error(f"Failed to fetch URL {url}: {e}")
            raise

    def extract_metadata(self, soup, url):
        try:
            meta_title = soup.find('meta', property='og:novel:book_name')
            meta_author = soup.find('meta', property='og:novel:author')
            meta_image = soup.find('meta', property='og:image')
            meta_description = soup.find('meta', {'name': 'description'})
            
            title = meta_title['content'] if meta_title else "Unknown"
            author = meta_author['content'] if meta_author else "Unknown"
            cover = meta_image['content'] if meta_image else None
            
            total_chapters = 0
            if meta_description:
                desc = meta_description['content']
                match = re.search(r'章節[：:]\s*(\d+)', desc)
                if match:
                    total_chapters = int(match.group(1))

            return {
                "title": title[:255],
                "author": author[:100],
                "cover_url": cover[:500] if cover else None,
                "total_chapters": total_chapters,
                "source_url": url[:500]
            }
        except Exception as e:
            logger.error(f"Failed to extract metadata: {e}")
            raise

    def fetch_chapter_content(self, url):
        try:
            soup = self.fetch_html(url)
            
            # Extract title
            title = "Unknown Chapter"
            title_elements = soup.select('h1, title')
            for element in title_elements:
                if element.text.strip():
                    title = element.text.strip()
                    title = re.sub(r'[-|]爱下电子书.*$', '', title).strip()
                    break
            
            # Extract content
            content = ""
            page_div = soup.find('div', id='page')
            if page_div:
                # Clean unwanted elements
                for element in page_div.select('script, style, .ad, .advertisement'):
                    element.decompose()
                
                text = page_div.get_text("\n", strip=True)
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                
                # Filter out ads and short lines
                filtered_lines = []
                for line in lines:
                    if (len(line) > 10 and 
                        not any(x in line for x in ['广告', 'ADVERTISEMENT', '推广', 'SPONSORED'])):
                        filtered_lines.append(line)
                
                content = '\n'.join(filtered_lines)
            
            return title[:255], content
            
        except Exception as e:
            logger.error(f"Failed to fetch chapter content from {url}: {e}")
            return "Error Chapter", ""

    def ingest_novel(self, url: str, limit: int = 5):
        try:
            logger.info(f"Starting ingestion for URL: {url}")
            
            # Fetch and parse main page
            soup = self.fetch_html(url)
            metadata = self.extract_metadata(soup, url)
            
            # Check if novel already exists
            from app.models.novel import Novel, Chapter
            existing_novel = self.db.query(Novel).filter(Novel.source_url == url).first()
            if existing_novel:
                return {"status": "exists", "novel_id": existing_novel.id, "message": "Novel already exists"}
            
            # Create novel record
            novel = Novel(
                title=metadata['title'],
                author=metadata['author'],
                cover_url=metadata['cover_url'],
                source_url=metadata['source_url'],
                total_chapters=metadata['total_chapters']
            )
            self.db.add(novel)
            self.db.flush()
            
            # Fetch sample chapters
            chapters_ingested = 0
            for i in range(1, min(limit, metadata['total_chapters']) + 1):
                try:
                    chapter_url = f"{url.rstrip('/')}/p{i}.html"
                    title, content = self.fetch_chapter_content(chapter_url)
                    
                    chapter = Chapter(
                        novel_id=novel.id,
                        chapter_number=i,
                        title=title,
                        original_content=content,
                        source_url=chapter_url[:500]
                    )
                    self.db.add(chapter)
                    chapters_ingested += 1
                    
                    time.sleep(1)  # Be polite to the server
                    
                except Exception as e:
                    logger.error(f"Failed to fetch chapter {i}: {e}")
                    continue
            
            self.db.commit()
            return {
                "status": "success", 
                "novel_id": novel.id, 
                "chapters_ingested": chapters_ingested
            }
            
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Database integrity error: {e}")
            return {"status": "error", "message": "Database integrity error"}
        except Exception as e:
            self.db.rollback()
            logger.error(f"Unexpected error during ingestion: {e}")
            return {"status": "error", "message": str(e)}
