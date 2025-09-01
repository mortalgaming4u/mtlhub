# backend/app/models/novel.py

from sqlalchemy import Column, Integer, String
from app.db.session import Base

class Novel(Base):
    __tablename__ = "novels"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    author = Column(String(100), nullable=True)
    cover_url = Column(String(500), nullable=True)
    source_url = Column(String(500), unique=True, nullable=False)
    total_chapters = Column(Integer, default=0)
