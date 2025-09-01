# backend/app/services/novel_service.py

from sqlalchemy.orm import Session
from ..models.novel import Novel
from ..schemas.novel import NovelCreate

def get_novel(db: Session, novel_id: int) -> Novel | None:
    return db.query(Novel).filter(Novel.id == novel_id).first()

def list_novels(db: Session, skip: int = 0, limit: int = 100) -> list[Novel]:
    return db.query(Novel).offset(skip).limit(limit).all()

def create_novel(db: Session, novel_in: NovelCreate) -> Novel:
    novel = Novel(**novel_in.dict())
    db.add(novel)
    db.commit()
    db.refresh(novel)
    return novel
