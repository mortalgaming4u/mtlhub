from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from app.services.ixdzs_ingestor import IxdzsIngestor
from app.db.session import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter()

class IngestRequest(BaseModel):
    bookUrl: HttpUrl
    chapterPattern: str = ""
    imageUrl: HttpUrl | None = None
    titleEn: str
    titleZh: str
    synopsis: str = ""
    author: str
    genres: str = ""
    tags: str = ""

@router.post("/api/ingest")
def ingest_novel(payload: IngestRequest, db: Session = Depends(get_db)):
    ingestor = IxdzsIngestor(db, service_role_key="admin")

    result = ingestor.ingest_novel(
        url=payload.bookUrl,
        limit=None  # You can add support for limit later
    )

    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail=result.get("message", "Ingestion failed"))

    # Optionally update metadata manually here
    novel = db.query(Novel).get(result["novel_id"])
    novel.title = payload.titleEn
    novel.title_zh = payload.titleZh
    novel.cover_url = payload.imageUrl
    novel.description = payload.synopsis
    novel.author = payload.author
    novel.genres = payload.genres
    novel.tags = payload.tags
    db.commit()

    return {
        "novel_id": novel.id,
        "chapters_ingested": result["chapters_ingested"]
    }
