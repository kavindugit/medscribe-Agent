from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import tempfile
from app.agents.explainer.plain_language_agent import process_medical_report

router = APIRouter()

@router.post("/explainer/", tags=["Explainer"])
async def explain_medical_report(file: UploadFile = File(...)):
    """
    This endpoint takes a medical report file, processes it, and returns the plain-language explanation.
    """
    # Validate file type
    if not file.filename.lower().endswith(('.txt', '.pdf', '.doc', '.docx')):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a text, PDF, or Word document.")
    
    # Create temporary file with proper cleanup
    try:
        # Read file content
        content = await file.read()
        
        # For text files
        if file.filename.lower().endswith('.txt'):
            medical_report = content.decode('utf-8')
        else:
            # For other file types, you might need additional processing
            # For now, we'll assume text content
            try:
                medical_report = content.decode('utf-8')
            except:
                raise HTTPException(status_code=400, detail="Could not read file content as text. Please ensure the file contains readable text.")
        
        # Process the medical report
        explanation = process_medical_report(medical_report)
        
        return {
            "plain_language_explanation": explanation,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")