from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import os
from app.agents.advisor.medical_advisor_agent import get_report_recommendations  # Import the advisor agent's function

router = APIRouter()

@router.post("/advisor/", tags=["Advisor"])
async def get_medical_report_recommendations(file: UploadFile = File(...)):
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
    
    # Get the recommendations using the advisor agent logic
    try:
        recommendations = get_report_recommendations(medical_report)
    except ValueError as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

    # Clean up the temporary file after processing
    os.remove(temp_file_path)

    # Return the recommendations in the response
    return {
        "recommendations": recommendations,
    }
