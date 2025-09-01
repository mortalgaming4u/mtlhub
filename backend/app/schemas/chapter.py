# backend/app/schemas/chapter.py

from typing import Optional
from pydantic import BaseModel

class ChapterBase(BaseModel):
    index: int
    title: Optional[str] = None
    content: str

class ChapterCreate(ChapterBase):
    novel_id: int

class ChapterRead(ChapterBase):
    id: int
    novel_id: int

    class Config:
        orm_mode = True
