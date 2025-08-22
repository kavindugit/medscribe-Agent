from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_services.api.routers import report

app = FastAPI(title="MedScribe Agent")

# CORS (allow frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root & health check
@app.get("/")
def root():
    return {"message": "MedScribe API running"}

@app.get("/health")
def health():
    return {"ok": True}

# Routers
app.include_router(report.router)
