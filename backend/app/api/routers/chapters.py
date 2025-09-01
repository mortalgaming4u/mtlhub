# backend/app/api/routers/chapters.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...db import SessionLocal
from ...schemas.chapter import ChapterCreate, ChapterRead
from ...services.chapter_service import list_chapters, create_chapter
from ...services.novel_service import get_novel

router = APIRouter(prefix="/chapters", tags=["chapters"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ChapterRead)
def create(chapter: ChapterCreate, db: Session = Depends(get_db)):
    if not get_novel(db, chapter.novel_id):
        raise HTTPException(status_code=404, detail="Parent novel not found")
    return create_chapter(db, chapter)

@router.get("/novel/{novel_id}", response_model=list[ChapterRead])
def read_for_novel(novel_id: int, db: Session = Depends(get_db)):
    if not get_novel(db, novel_id):
        raise HTTPException(status_code=404, detail="Novel not found")
    return list_chapters(db, novel_id)
