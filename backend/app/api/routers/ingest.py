from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os

from app.db.session import get_db
from app.services.novel_ingestor import get_ingestor   # ← swapped in
from app.schemas.ingest import IngestRequest, IngestResponse

router = APIRouter(
    prefix="/ingest",
    tags=["ingest"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=IngestResponse, summary="Ingest a novel by URL")
def ingest_novel(
    request: IngestRequest,
    db: Session = Depends(get_db),
):
    """
    Ingests a novel from the provided URL and stores metadata + chapters.
    Returns IngestResponse with status, novel_id, chapters_ingested, and optional message.
    """
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Missing Supabase service role key"
        )

    # Use domain-based factory instead of generic NovelIngestor
    ingestor = get_ingestor(
        db=db,
        service_key=service_key,
        url=request.url
    )

    result = ingestor.ingest_novel(url=request.url)
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Unknown ingestion error")
        )

    return IngestResponse(**result)
