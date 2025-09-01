# backend/app/models/chapter.py

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..db import Base

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    novel_id = Column(Integer, ForeignKey("novels.id", ondelete="CASCADE"), nullable=False, index=True)
    index = Column(Integer, nullable=False)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)

    novel = relationship("Novel", back_populates="chapters")
