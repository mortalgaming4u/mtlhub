import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from app.services.novel_ingestor import NovelIngestor

router = APIRouter(
    prefix="/ingest",
    tags=["ingest"],
)


class IngestRequest(BaseModel):
    url: HttpUrl


class IngestResponse(BaseModel):
    success: bool
    novel_id: int


@router.post("/", response_model=IngestResponse)
async def ingest_novel(req: IngestRequest):
    """
    Trigger the novel ingestion pipeline for the given URL.
    """
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not service_key:
        raise HTTPException(500, detail="Supabase service role key not configured")

    try:
        ingestor = NovelIngestor(service_role_key=service_key)
        result = ingestor.ingest(req.url)
        return IngestResponse(success=True, novel_id=result.novel_id)
    except Exception as e:
        # Log full stack in your logger if desired
        raise HTTPException(status_code=500, detail=str(e))
