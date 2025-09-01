from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os

from app.db.session import get_db
from app.services.novel_ingestor import get_ingestor
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
    # Pull your Supabase key from env
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not service_role_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Missing Supabase service role key",
        )

    # ← use service_role_key (not service_key)
    ingestor = get_ingestor(
        db=db,
        service_role_key=service_role_key,
        url=request.url,
    )

    result = ingestor.ingest_novel(url=request.url, limit=request.limit)
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Unknown ingestion error"),
        )

    return IngestResponse(**result)
