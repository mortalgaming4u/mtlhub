# backend/app/services/chapter_service.py

from sqlalchemy.orm import Session
from ..models.chapter import Chapter
from ..schemas.chapter import ChapterCreate

def list_chapters(db: Session, novel_id: int) -> list[Chapter]:
    return db.query(Chapter).filter(Chapter.novel_id == novel_id).all()

def create_chapter(db: Session, chap_in: ChapterCreate) -> Chapter:
    chapter = Chapter(**chap_in.dict())
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter
