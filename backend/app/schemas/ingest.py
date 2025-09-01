# app/schemas/ingest.py

from pydantic import BaseModel

class IngestRequest(BaseModel):
    url: str

class IngestResponse(BaseModel):
    status: str
    novel_id: int | None = None
    chapters_ingested: int | None = None
    message: str | None = None
