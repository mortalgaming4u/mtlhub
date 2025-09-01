# backend/app/schemas/chapter.py

from pydantic import BaseModel

class ChapterBase(BaseModel):
    chapter_number: int
    title: str
    original_content: str
    source_url: str

class ChapterCreate(ChapterBase):
    novel_id: int

class ChapterOut(ChapterBase):
    id: int
    novel_id: int

    class Config:
        orm_mode = True
