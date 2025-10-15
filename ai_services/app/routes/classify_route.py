from fastapi import APIRouter, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
from datetime import datetime

# Import the agents
from app.agents.validator.validator import validate_report, CleanedTextOutput
from app.agents.classifier.classifier import classify_report

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/classify", tags=["classify"])

# Request/Response Models
class ValidationResponse(BaseModel):
    cleaned_text: str

class DomainEntryModel(BaseModel):
    level: str
    explanation: str

class ClassificationModel(BaseModel):
    overall_classification: Optional[str] = None
    domains: Optional[Dict[str, DomainEntryModel]] = None
    human_readable: Optional[str] = None
    message: Optional[str] = None

class ClassifyResponse(BaseModel):
    original_text: str
    validated_text: str
    classification: ClassificationModel
    processing_steps: Dict[str, Any]
    timestamp: str

class AgentChainOrchestrator:
    def __init__(self):
        self.processing_steps = {}

    def process_medical_report(self, medical_report: str) -> Dict[str, Any]:
        try:
            # Step 1: Validate and clean the report
            logger.info("[classify] Starting validation step…")
            validation_start = datetime.now()

            validated_result: CleanedTextOutput = validate_report(medical_report)
            validated_text = validated_result.cleaned_text

            validation_end = datetime.now()
            self.processing_steps["validation"] = {
                "status": "completed",
                "duration_seconds": (validation_end - validation_start).total_seconds(),
                "input_length": len(medical_report),
                "output_length": len(validated_text),
            }

            # Step 2: Classify the validated report
            logger.info("[classify] Starting classification step…")
            classify_start = datetime.now()

            classification_result = classify_report(validated_text)

            classify_end = datetime.now()

            # Normalize the classifier response for the API schema
            if hasattr(classification_result, "model_dump"):
                classification_payload = classification_result.model_dump()
            elif hasattr(classification_result, "dict"):
                classification_payload = classification_result.dict()
            else:
                classification_payload = classification_result

            domain_count = 0
            domains = classification_payload.get("domains") if isinstance(classification_payload, dict) else None
            if isinstance(domains, dict):
                domain_count = len(domains)

            self.processing_steps["classification"] = {
                "status": "completed",
                "duration_seconds": (classify_end - classify_start).total_seconds(),
                "domain_count": domain_count,
            }

            return {
                "original_text": medical_report,
                "validated_text": validated_text,
                "classification": classification_payload,
                "processing_steps": self.processing_steps,
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error in classification agent chain: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Agent chain processing failed: {str(e)}",
            )


# Initialize the orchestrator
orchestrator = AgentChainOrchestrator()


@router.post("/process-medical-report", response_model=ClassifyResponse)
async def process_medical_report(file: UploadFile = File(...)):
    """
    Main API endpoint that chains validator -> classifier agents using a file upload.
    """
    try:
        # Read file content
        file_content = await file.read()
        medical_report = file_content.decode("utf-8")  # Assuming it's a text file

        if not medical_report.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Medical report file cannot be empty",
            )

        logger.info(f"[classify] Processing medical report of length: {len(medical_report)}")

        # Process through the agent chain
        result = orchestrator.process_medical_report(medical_report=medical_report)

        logger.info("[classify] Agent chain processing completed successfully")

        return ClassifyResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in process_medical_report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred during processing",
        )


@router.post("/validate-medical-report", response_model=ValidationResponse)
async def validate_medical_report(file: UploadFile = File(...)):
    """
    Endpoint to only run the validation agent (first step in the chain) using a file upload.
    """
    try:
        # Read file content
        file_content = await file.read()
        medical_report = file_content.decode("utf-8")

        if not medical_report.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Medical report file cannot be empty",
            )

        logger.info(f"[classify] Validating medical report of length: {len(medical_report)}")

        # Run only the validation step
        validated_result: CleanedTextOutput = validate_report(medical_report)

        return ValidationResponse(cleaned_text=validated_result.cleaned_text)

    except Exception as e:
        logger.error(f"Error in validate_medical_report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}",
        )


@router.get("/health-check")
async def health_check():
    """
    Health check endpoint for the classify service
    """
    return {
        "status": "healthy",
        "service": "classifier_agent_chain",
        "timestamp": datetime.now().isoformat(),
        "available_agents": ["validator", "classifier"],
    }