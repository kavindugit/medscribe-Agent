from fastapi import APIRouter, HTTPException, Header
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.agents.classifier_agent import ClassifierAgent
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/classifier", tags=["classifier"])

class LabReportRequest(BaseModel):
    report_text: str

class AnalysisResponse(BaseModel):
    success: bool
    message: str
    data: Any = None

# Lazy initialization of classifier agent
_classifier_agent = None

def get_classifier_agent() -> ClassifierAgent:
    """Get or create classifier agent instance."""
    global _classifier_agent
    if _classifier_agent is None:
        _classifier_agent = ClassifierAgent()
    return _classifier_agent

@router.post("/analyze-report", response_model=AnalysisResponse)
async def analyze_lab_report(
    request: LabReportRequest,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id")
):
    """
    Analyze any lab report text and provide patient-friendly health insights.
    
    Takes any text containing lab results and uses Gemini AI to:
    - Extract all numerical lab values
    - Classify each value as Normal, Borderline, or Abnormal
    - Provide patient-friendly explanations
    - Give overall health assessment
    - Suggest when to consult a doctor
    
    Args:
        request: LabReportRequest containing the lab report text
        x_user_id: Optional user ID from header
        
    Returns:
        AnalysisResponse with detailed health analysis including:
        - overall_assessment: Health status and summary
        - test_results: Individual test classifications and explanations
        - recommendations: Actionable health advice
        - when_to_see_doctor: Medical consultation guidance
        - health_tips: General wellness advice
    """
    try:
        if not request.report_text.strip():
            raise HTTPException(status_code=400, detail="No lab report text provided")
        
        # Analyze the lab report using Gemini AI
        classifier_agent = get_classifier_agent()
        analysis = await classifier_agent.analyze_lab_report(request.report_text)
        logger.error(f"Raw agent analysis result: {analysis}")  # Log the raw agent response
        
        return AnalysisResponse(
            success=True,
            message="Lab report analyzed successfully",
            data=analysis
        )
        
    except Exception as e:
        logger.error(f"Error in analyze_lab_report route: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/health")
async def classifier_health():
    """Health check endpoint for the medical lab analyzer service."""
    return {
        "status": "healthy", 
        "service": "medical_lab_analyzer",
        "description": "AI-powered medical lab report analyzer for patient-friendly health insights"
    }
