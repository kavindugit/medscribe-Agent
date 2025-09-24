# app/routes/advisor.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.agents.advisor.medical_advisor_agent import provide_general_medical_advice

router = APIRouter()

class MedicalAdviceRequest(BaseModel):
    medical_report: str
    age: Optional[int] = None
    gender: Optional[str] = None
    current_medications: Optional[str] = None
    allergies: Optional[str] = None
    past_medical_history: Optional[str] = None
    social_history: Optional[str] = None
    family_history: Optional[str] = None

@router.post("/medical-advice/", tags=["Medical Advisor"])
async def get_medical_advice(request: MedicalAdviceRequest):
    """
    Get comprehensive medical recommendations from the general medical advisor agent.
    Provides deep, detailed medical advice similar to a primary care physician's recommendations.
    """
    try:
        # Call the general medical advisor agent
        advice = provide_general_medical_advice(
            medical_report=request.medical_report,
            age=request.age,
            gender=request.gender,
            current_meds=request.current_medications,
            allergies=request.allergies,
            past_history=request.past_medical_history,
            social_history=request.social_history,
            family_history=request.family_history
        )
        
        return {
            "medical_advice": advice.dict(),
            "advisor_type": "General Medical Advisor",
            "timestamp": datetime.now().isoformat(),
            "patient_context_used": {
                "age_provided": request.age is not None,
                "gender_provided": request.gender is not None,
                "medications_provided": request.current_medications is not None,
                "allergies_provided": request.allergies is not None
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error generating medical advice: {str(e)}"
        )

@router.post("/medical-advice/simple", tags=["Medical Advisor"])
async def get_medical_advice_simple(medical_report: str):
    """
    Simplified endpoint that only requires the medical report.
    Useful when patient context information is not available.
    """
    try:
        advice = provide_general_medical_advice(medical_report=medical_report)
        
        return {
            "medical_advice": advice.dict(),
            "advisor_type": "General Medical Advisor (Simplified)",
            "timestamp": datetime.now().isoformat(),
            "note": "Recommendations based on medical report only. Provide additional patient context for more personalized advice."
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error generating medical advice: {str(e)}"
        )

@router.get("/medical-advice/health", tags=["Medical Advisor"])
async def health_check():
    """
    Health check endpoint for the medical advisor service.
    """
    return {
        "status": "healthy",
        "service": "General Medical Advisor",
        "timestamp": datetime.now().isoformat()
    }