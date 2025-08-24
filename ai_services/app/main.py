from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.ingest import router as ingest_router
from app.routes.cases import router as cases_router

app = FastAPI(title="ai_services")

app.include_router(health_router)
app.include_router(ingest_router)
app.include_router(cases_router)
