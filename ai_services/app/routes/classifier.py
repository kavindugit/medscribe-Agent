# app/routes/classifier.py
from urllib import response
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import os
from app.agents.classifier.classifier import classify_report  

router = APIRouter()

@router.post("/classify_medical_report/")
async def classify_medical_report(file: UploadFile = File(...)):
    # Save the uploaded file temporarily
    temp_file_path = f"temp_{file.filename}"

    with open(temp_file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Read the medical report
    try:
        with open(temp_file_path, "r") as f:
            medical_report = f.read()
    except Exception as e:
        return JSONResponse(content={"error": f"Error reading file: {str(e)}"}, status_code=400)

    # Run classifier
    try:
        response = classify_report(medical_report)  # returns ClassifierOutput
    except ValueError as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

    # Clean up temp file
    os.remove(temp_file_path)

    # ✅ Just return the model as JSON
    return response.model_dump()



