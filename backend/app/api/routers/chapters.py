# backend/app/api/routers/novels.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.schemas.novel import NovelCreate, NovelRead
from app.services.novel_service import create_novel, get_novel, list_novels

router = APIRouter(prefix="/novels", tags=["novels"])

@router.post("/", response_model=NovelRead)
def create_novel_endpoint(novel: NovelCreate, db: Session = Depends(get_db)):
    return create_novel(db, novel)

@router.get("/", response_model=list[NovelRead])
def list_novels_endpoint(db: Session = Depends(get_db)):
    return list_novels(db)

@router.get("/{novel_id}", response_model=NovelRead)
def get_novel_endpoint(novel_id: int, db: Session = Depends(get_db)):
    novel = get_novel(db, novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")
    return novel
