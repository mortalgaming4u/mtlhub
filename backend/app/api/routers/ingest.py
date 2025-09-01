from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.novel_ingestor import NovelIngestor
from app.schemas.ingest import IngestRequest, IngestResponse
import os

router = APIRouter()

@router.post("/ingest", response_model=IngestResponse)
def ingest_novel(request: IngestRequest, db: Session = Depends(get_db)):
    """
    Ingests a novel from the provided URL and stores metadata + chapters.
    """
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Missing Supabase service role key"
        )

    ingestor = NovelIngestor(db=db, service_role_key=service_key)

    try:
        result = ingestor.ingest_novel(url=request.url)
        return IngestResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
