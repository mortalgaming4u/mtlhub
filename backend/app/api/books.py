# backend/app/api/books.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.book import BookCreate, BookOut
from app.crud.book import create_book, get_books

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/books/", response_model=BookOut)
def create_book_endpoint(book: BookCreate, db: Session = Depends(get_db)):
    return create_book(db=db, book=book)

@router.get("/books/", response_model=list[BookOut])
def list_books_endpoint(db: Session = Depends(get_db)):
    return get_books(db=db)
