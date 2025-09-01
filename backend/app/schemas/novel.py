# backend/app/schemas/novel.py

from pydantic import BaseModel

class NovelBase(BaseModel):
    title: str
    author: str | None = None
    cover_url: str | None = None
    source_url: str
    total_chapters: int = 0

class NovelCreate(NovelBase):
    pass

class NovelRead(NovelBase):
    id: int

    class Config:
        orm_mode = True

