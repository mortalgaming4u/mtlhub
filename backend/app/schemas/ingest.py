from typing import Optional
from pydantic import BaseModel, HttpUrl

class IngestRequest(BaseModel):
    url: HttpUrl
    # Optional limit on number of chapters (None = unlimited/default)
    limit: Optional[int] = None


class IngestResponse(BaseModel):
    status: str
    novel_id: int
    chapters_ingested: int
    message: Optional[str] = None
