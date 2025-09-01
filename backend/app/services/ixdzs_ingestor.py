def ingest_novel(self, url: Union[str, HttpUrl], limit: int = None) -> dict:
    url_str = str(url)
    logger.info(f"Begin ixdzs ingestion: {url_str}")

    # 1) Fetch listing page
    try:
        soup = self.fetch_html(url_str)
    except Exception as e:
        logger.error(f"[ixdzs] Failed to fetch main page {url_str}: {e}")
        return {
            "status": "error",
            "message": f"Failed to fetch page: {e}"
        }

    # 2) Extract metadata
    meta = self.extract_metadata(soup, url_str)

    # 3) Check for existing novel
    existing = (
        self.db.query(Novel)
        .filter(Novel.source_url == meta["source_url"])
        .first()
    )
    if existing:
        return {
            "status": "exists",
            "novel_id": existing.id,
            "chapters_ingested": 0,
            "total_chapters_found": 0
        }

    # 4) Create novel record
    novel = Novel(**meta)
    self.db.add(novel)
    try:
        self.db.flush()
    except Exception as e:
        self.db.rollback()
        logger.error(f"[ixdzs] Failed to create novel record: {e}")
        return {
            "status": "error",
            "message": f"Failed to create novel: {e}"
        }

    # 5) Gather chapter URLs
    chapter_urls = self.get_chapter_urls(soup, url_str)
    if not chapter_urls:
        logger.warning(f"[ixdzs] No chapters found for {url_str}")
        return {
            "status": "warning",
            "message": "No chapters found",
            "novel_id": novel.id,
            "chapters_ingested": 0,
            "total_chapters_found": 0
        }

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

            # Commit every 10 chapters
            if ingested % 10 == 0:
                try:
                    self.db.commit()
                    logger.info(f"[ixdzs] Committed {ingested} chapters so far")
                except Exception as e:
                    self.db.rollback()
                    logger.error(f"[ixdzs] Failed to commit chapters: {e}")
                    break

            time.sleep(0.5)

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
        return {
            "status": "error",
            "message": f"Failed to save chapters: {e}",
            "novel_id": novel.id
        }

    return {
        "status": "success",
        "novel_id": novel.id,
        "chapters_ingested": ingested,
        "total_chapters_found": len(chapter_urls)
    }