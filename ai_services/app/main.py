from fastapi import FastAPI
from app.routes.health import health_router
from app.routes.ingest import ingest_router

app = FastAPI(title="AI Services", version="0.1.0")
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(ingest_router, tags=["process"])
