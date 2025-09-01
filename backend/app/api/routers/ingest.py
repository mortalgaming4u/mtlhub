# app/api/routers/ingest.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os

from app.db.session import get_db
from app.services.novel_ingestor import NovelIngestor
from app.schemas.ingest import IngestRequest, IngestResponse

router = APIRouter()

@router.post("/ingest", response_model=IngestResponse)
def ingest_novel(
    req: IngestRequest,
    db: Session = Depends(get_db),
):
    """
    Ingest a novel from URL and store metadata + chapters.
    """
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Missing Supabase service role key",
        )

    ingestor = NovelIngestor(db=db, service_role_key=key)
    res = ingestor.ingest_novel(url=req.url)
    if res.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=res.get("message", "Unknown error"),
        )
    return IngestResponse(**res)
