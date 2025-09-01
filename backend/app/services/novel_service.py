# backend/app/services/novel_service.py

from sqlalchemy.orm import Session
from app.models.novel import Novel
from app.schemas.novel import NovelCreate

def create_novel(db: Session, novel_data: NovelCreate) -> Novel:
    novel = Novel(**novel_data.dict())
    db.add(novel)
    db.commit()
    db.refresh(novel)
    return novel

def get_novel(db: Session, novel_id: int) -> Novel | None:
    return db.query(Novel).filter(Novel.id == novel_id).first()

def get_novel_by_url(db: Session, source_url: str) -> Novel | None:
    return db.query(Novel).filter(Novel.source_url == source_url).first()

def list_novels(db: Session) -> list[Novel]:
    return db.query(Novel).order_by(Novel.id.desc()).all()
