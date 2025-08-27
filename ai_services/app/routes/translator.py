from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.agents import translator_agent

router = APIRouter(prefix="/translator", tags=["translator"])

@router.post("/translate")
async def translate(
    file: UploadFile = File(...),
    target_lang: str = Query("සිංහල", description="Target language for translation")
):
    """
    Upload a medical report (PDF, DOCX, TXT) and translate ONLY the medical test names
    into the target language. Numbers, units, and patient details remain unchanged.
    """
    try:
        return await translator_agent.process_translation(file, target_lang)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
