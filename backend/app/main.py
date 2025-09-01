# backend/app/main.py

"""
ASGI entrypoint for MTLHub backend.

Routers:
- /api/ingest → Novel ingestion via URL (see app/api/routers/ingest.py)

To run locally:
$ cd backend
$ uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.ingest import router as ingest_router

app = FastAPI(title="MTLHub API")

# CORS – restrict origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register your routers here
app.include_router(ingest_router, prefix="/api/ingest", tags=["ingest"])
