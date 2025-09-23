# app/routes/summarizer.py
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import os
from app.agents.translator.translator_agent import translate_report

router = APIRouter()

@router.post("/translator/", tags=["Translator"])
async def translate_medical_report(file: UploadFile = File(...)):
    # Save the uploaded file temporarily
    temp_file_path = f"temp_{file.filename}"
    
    with open(temp_file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Read the medical report from the file
    try:
        with open(temp_file_path, "r") as f:
            medical_report = f.read()
    except Exception as e:
        return JSONResponse(content={"error": f"Error reading file: {str(e)}"}, status_code=400)
    
    # Get the tranlation using the summarizer logic
    try:
        tranlation, sources, tools_used = translate_report(medical_report)
    except ValueError as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

    # Clean up the temporary file after processing
    os.remove(temp_file_path)

    # Return the tranlation in the response
    return {
        "tranlation": tranlation,
        "sources": sources,
        "tools_used": tools_used,
    }