# backend/app/models/chapter.py

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.db.session import Base

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    novel_id = Column(Integer, ForeignKey("novels.id"), nullable=False)
    chapter_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    original_content = Column(Text, nullable=True)
    source_url = Column(String(500), nullable=True)
