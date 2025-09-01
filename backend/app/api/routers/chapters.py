# backend/app/api/routers/chapters.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.schemas.chapter import ChapterCreate, ChapterRead
from app.services.chapter_service import list_chapters, create_chapter, get_chapter
from app.services.novel_service import get_novel

router = APIRouter(prefix="/chapters", tags=["chapters"])

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

@router.get("/{chapter_id}", response_model=ChapterRead)
def read_chapter(chapter_id: int, db: Session = Depends(get_db)):
    chapter = get_chapter(db, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter
