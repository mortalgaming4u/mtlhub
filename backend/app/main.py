# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import engine, Base
from .api.routers.novels import router as novels_router
from .api.routers.chapters import router as chapters_router

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MTLHub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(novels_router)
app.include_router(chapters_router)
