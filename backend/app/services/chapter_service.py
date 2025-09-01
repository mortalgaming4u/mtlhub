# backend/app/services/chapter_service.py

from sqlalchemy.orm import Session
from app.models.chapter import Chapter
from app.schemas.chapter import ChapterCreate

def create_chapter(db: Session, chapter_data: ChapterCreate) -> Chapter:
    chapter = Chapter(**chapter_data.dict())
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter

def list_chapters(db: Session, novel_id: int) -> list[Chapter]:
    return db.query(Chapter).filter(Chapter.novel_id == novel_id).order_by(Chapter.chapter_number).all()

def get_chapter(db: Session, chapter_id: int) -> Chapter | None:
    return db.query(Chapter).filter(Chapter.id == chapter_id).first()
