# backend/app/schemas/novel.py

from typing import List, Optional
from pydantic import BaseModel
from .chapter import ChapterRead

class NovelBase(BaseModel):
    title: str
    author: Optional[str] = None

class NovelCreate(NovelBase):
    pass

class NovelRead(NovelBase):
    id: int
    chapters: List[ChapterRead] = []

    class Config:
        orm_mode = True
