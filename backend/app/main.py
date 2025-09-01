# backend/app/main.py

"""
ASGI entrypoint for MTLHub backend.

Your ingestion endpoint is POST /api/ingest/
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers.ingest import router as ingest_router

app = FastAPI(title="MTLHub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single, simple prefix. Routers define their own sub‐paths.
app.include_router(ingest_router, prefix="/api")
