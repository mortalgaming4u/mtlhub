from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers.ingest import router as ingest_router

# NEW imports
from app.db.session import engine, Base

app = FastAPI(
    title="MTLHub API",
    debug=True,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router, prefix="/api")


@app.on_event("startup")
def on_startup_create_tables():
    Base.metadata.create_all(bind=engine)
