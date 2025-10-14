from fastapi import APIRouter, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
from datetime import datetime

# Import the agents
from app.agents.validator.validator import validate_report, CleanedTextOutput
from app.agents.summarizer.summarizer import summarize_report
from app.agents.tone_checker.tone_checker_agent import check_message_tone

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/summary", tags=["summary"])

# Request/Response Models
class SummaryRequest(BaseModel):
    include_tone_check: Optional[bool] = True
    
class ValidationResponse(BaseModel):
    cleaned_text: str
    
class SummaryResponse(BaseModel):
    original_text: str
    validated_text: str
    summary: str
    sources: list[str]
    tools_used: list[str]
    toned_summary: Optional[str] = None
    processing_steps: Dict[str, Any]
    timestamp: str

class AgentChainOrchestrator:
    """
    Orchestrator class to manage the agent chaining process:
    1. Validator Agent -> Cleans and standardizes the medical report
    2. Summarizer Agent -> Creates summary from validated text
    3. Tone Checker Agent -> Adjusts tone for patient-friendly output
    """
    
    def __init__(self):
        self.processing_steps = {}
        
    def process_medical_report(self, medical_report: str, include_tone_check: bool = True) -> Dict[str, Any]:
        """
        Chains the agents to process a medical report through validation, summarization, and tone checking.
        
        Args:
            medical_report (str): Raw medical report text
            include_tone_check (bool): Whether to include tone checking step
            
        Returns:
            Dict containing all processing results and metadata
        """
        try:
            # Step 1: Validate and clean the report
            logger.info("Starting validation step...")
            validation_start = datetime.now()
            
            validated_result: CleanedTextOutput = validate_report(medical_report)
            validated_text = validated_result.cleaned_text
            
            validation_end = datetime.now()
            self.processing_steps["validation"] = {
                "status": "completed",
                "duration_seconds": (validation_end - validation_start).total_seconds(),
                "input_length": len(medical_report),
                "output_length": len(validated_text)
            }
            
            # Step 2: Summarize the validated report
            logger.info("Starting summarization step...")
            summary_start = datetime.now()
            
            summary, sources, tools_used = summarize_report(validated_text)
            
            summary_end = datetime.now()
            self.processing_steps["summarization"] = {
                "status": "completed",
                "duration_seconds": (summary_end - summary_start).total_seconds(),
                "sources_found": len(sources),
                "tools_used": tools_used
            }
            
            # Step 3: Tone check (optional)
            toned_summary = None
            if include_tone_check:
                logger.info("Starting tone checking step...")
                tone_start = datetime.now()
                
                toned_summary = check_message_tone(summary)
                
                tone_end = datetime.now()
                self.processing_steps["tone_checking"] = {
                    "status": "completed",
                    "duration_seconds": (tone_end - tone_start).total_seconds(),
                    "original_summary_length": len(summary),
                    "toned_summary_length": len(toned_summary)
                }
            else:
                self.processing_steps["tone_checking"] = {
                    "status": "skipped",
                    "reason": "include_tone_check set to False"
                }
            
            return {
                "original_text": medical_report,
                "validated_text": validated_text,
                "summary": summary,
                "sources": sources,
                "tools_used": tools_used,
                "toned_summary": toned_summary,
                "processing_steps": self.processing_steps,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in agent chain processing: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Agent chain processing failed: {str(e)}"
            )

# Initialize the orchestrator
orchestrator = AgentChainOrchestrator()

@router.post("/process", response_model=SummaryResponse)
async def process_medical_report(file: UploadFile = File(...), include_tone_check: Optional[bool] = True):
    """
    Main API endpoint that chains validator -> summarizer -> tone checker agents using a file upload.
    
    Args:
        file: The medical report file (txt)
        include_tone_check: Whether to include tone checking step
        
    Returns:
        SummaryResponse with all processing results and metadata
    """
    try:
        # Read file content
        file_content = await file.read()
        medical_report = file_content.decode("utf-8")  # Assuming it's a text file
        
        if not medical_report.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Medical report file cannot be empty"
            )
        
        logger.info(f"Processing medical report of length: {len(medical_report)}")
        
        # Process through the agent chain
        result = orchestrator.process_medical_report(
            medical_report=medical_report,
            include_tone_check=include_tone_check
        )
        
        logger.info("Agent chain processing completed successfully")
        
        return SummaryResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in process_medical_report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred during processing"
        )

@router.post("/validate-only", response_model=ValidationResponse)
async def validate_medical_report(file: UploadFile = File(...)):
    """
    Endpoint to only run the validation agent (first step in the chain) using a file upload.
    
    Args:
        file: The medical report file (txt)
        
    Returns:
        ValidationResponse with cleaned and standardized text
    """
    try:
        # Read file content
        file_content = await file.read()
        medical_report = file_content.decode("utf-8")
        
        if not medical_report.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Medical report file cannot be empty"
            )
        
        logger.info(f"Validating medical report of length: {len(medical_report)}")
        
        # Run only the validation step
        validated_result: CleanedTextOutput = validate_report(medical_report)
        
        return ValidationResponse(cleaned_text=validated_result.cleaned_text)
        
    except Exception as e:
        logger.error(f"Error in validate_medical_report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint for the summary service
    """
    return {
        "status": "healthy",
        "service": "summary_agent_chain",
        "timestamp": datetime.now().isoformat(),
        "available_agents": ["validator", "summarizer", "tone_checker"]
    }