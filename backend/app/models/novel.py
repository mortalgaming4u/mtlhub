from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base  # now available

class Novel(Base):
    __tablename__ = "novels"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    source_url = Column(String, unique=True, index=True)
    total_chapters = Column(Integer, default=0)

    # Relationship to chapters
    chapters = relationship("Chapter", back_populates="novel")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    novel_id = Column(Integer, ForeignKey("novels.id"), nullable=False, index=True)
    chapter_number = Column(Integer, default=0, index=True)
    title = Column(String, nullable=True)
    original_content = Column(Text, nullable=False)
    source_url = Column(String, unique=True, index=True)

    # Back‐reference to novel
    novel = relationship("Novel", back_populates="chapters")
