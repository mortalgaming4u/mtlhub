# backend/app/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.api.routers.novels import router as novels_router
from app.api.routers.chapters import router as chapters_router
from app.api.routers.ingest import router as ingest_router
import logging

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="MTLHub API",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Consider restricting in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with explicit prefixes
app.include_router(
    novels_router,
    prefix="/api/novels",
    tags=["novels"],
)
app.include_router(
    chapters_router,
    prefix="/api/chapters",
    tags=["chapters"],
)
app.include_router(
    ingest_router,
    prefix="/api/ingest",
    tags=["ingest"],
)
