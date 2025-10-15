from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import os
from app.agents.advisor.medical_advisor_agent import get_report_recommendations  # Import the advisor agent's function
from app.agents.tone_checker.tone_checker_agent import check_message_tone  # Import the Tone Checker Agent
from app.agents.translator.translator_agent import translate_report  # Import the Translator Agent

# Initialize the router for the Advisor
router = APIRouter()

@router.post("/advisor/", tags=["Advisor"])
async def get_medical_report_recommendations(file: UploadFile = File(...)):
    """
    Endpoint to process a medical report file, generate recommendations,
    neutralize tone, and translate the recommendations to Sinhala.
    """
    
    # Save the uploaded file temporarily
    temp_file_path = f"temp_{file.filename}"
    
    try:
        with open(temp_file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Read the medical report content from the temporary file
        with open(temp_file_path, "r") as f:
            medical_report = f.read()

    except Exception as e:
        # Handle errors during file reading or saving
        return JSONResponse(content={"error": f"Error reading file: {str(e)}"}, status_code=400)
    
    # Step 1: Get the recommendations using the advisor agent logic
    try:
        recommendations = get_report_recommendations(medical_report)  # Generate the recommendations
    except ValueError as e:
        # Handle errors from the advisor agent
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
    # Step 2: Pass the generated recommendations through the Tone Checker to neutralize the tone
    recommendations_with_neutral_tone = check_message_tone(recommendations)  # Neutralize the tone of the recommendations
    
    # # Step 3: Translate the neutralized recommendations to Sinhala
    # translated_recommendations = translate_report(recommendations_with_neutral_tone)  # Translate to Sinhala
    
    # Clean up the temporary file after processing
    try:
        os.remove(temp_file_path)  # Remove the temporary file
    except Exception as e:
        # Log an error or handle cleanup issues (you can log it in real-world applications)
        return JSONResponse(content={"error": f"Error cleaning up temporary file: {str(e)}"}, status_code=500)
    
    # Return the translated recommendations (in Sinhala)
    return {
        "recommendations": recommendations_with_neutral_tone,  # Return recommendations with neutral tone in English
        # "recommendations": translated_recommendations,  # Return translated recommendations in Sinhala
    }
