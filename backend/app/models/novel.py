# backend/app/models/novel.py

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..db import Base

class Novel(Base):
    __tablename__ = "novels"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, nullable=False, index=True)
    author = Column(String, nullable=True)

    chapters = relationship(
        "Chapter",
        back_populates="novel",
        cascade="all, delete-orphan",
        order_by="Chapter.index"
    )
