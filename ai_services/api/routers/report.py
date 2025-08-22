from fastapi import APIRouter, UploadFile, File, HTTPException
from ai_services.agents import report_analyzer


router = APIRouter(prefix="/report", tags=["report"])

@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        return await report_analyzer.process_report(file)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
