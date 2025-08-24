from fastapi import APIRouter

health_router = APIRouter()

@health_router.get("/")
async def health():
    return {"status": "ok", "service": "ai_services", "version": "0.1.0"}
