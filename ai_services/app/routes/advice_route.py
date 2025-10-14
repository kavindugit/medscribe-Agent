from fastapi import APIRouter, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime

# Import the agents
from app.agents.validator.validator import validate_report, CleanedTextOutput
from app.agents.summarizer.summarizer import summarize_report
from app.agents.advisor.medical_advisor_agent import get_report_recommendations
from app.agents.tone_checker.tone_checker_agent import check_message_tone

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/advice", tags=["advice"])


# Request/Response Models
class ValidationResponse(BaseModel):
	cleaned_text: str


class AdviceResponse(BaseModel):
	original_text: str
	validated_text: str
	summary: str
	sources: List[str]
	tools_used: List[str]
	recommendations: str
	toned_recommendations: Optional[str] = None
	processing_steps: Dict[str, Any]
	timestamp: str


class AgentChainOrchestrator:
	"""
	Orchestrator to manage advice agent chain:
	1. Validator Agent -> Clean/standardize report
	2. Summarizer Agent -> Create summary from validated text
	3. Advisor Agent -> Generate recommendations from summary/content
	4. Tone Checker Agent -> Patient-friendly recommendations
	"""

	def __init__(self):
		self.processing_steps = {}

	def process_medical_report(self, medical_report: str) -> Dict[str, Any]:
		try:
			# Step 1: Validate and clean the report
			logger.info("[advice] Starting validation step…")
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

			# Step 2: Summarize the validated report
			logger.info("[advice] Starting summarization step…")
			summary_start = datetime.now()

			summary, sources, tools_used = summarize_report(validated_text)

			summary_end = datetime.now()
			self.processing_steps["summarization"] = {
				"status": "completed",
				"duration_seconds": (summary_end - summary_start).total_seconds(),
				"sources_found": len(sources),
				"tools_used": tools_used,
			}

			# Step 3: Advisor recommendations based on the summary/content
			logger.info("[advice] Starting advisor step…")
			advisor_start = datetime.now()

			# Pass the summary to advisor for focused recommendations
			recommendations = get_report_recommendations(summary)

			advisor_end = datetime.now()
			self.processing_steps["advice"] = {
				"status": "completed",
				"duration_seconds": (advisor_end - advisor_start).total_seconds(),
				"recommendation_length": len(recommendations),
			}

			# Step 4: Tone check the recommendations
			logger.info("[advice] Starting tone checking step…")
			tone_start = datetime.now()

			toned_recommendations = check_message_tone(recommendations)

			tone_end = datetime.now()
			self.processing_steps["tone_checking"] = {
				"status": "completed",
				"duration_seconds": (tone_end - tone_start).total_seconds(),
				"original_length": len(recommendations),
				"toned_length": len(toned_recommendations or ""),
			}

			return {
				"original_text": medical_report,
				"validated_text": validated_text,
				"summary": summary,
				"sources": sources,
				"tools_used": tools_used,
				"recommendations": recommendations,
				"toned_recommendations": toned_recommendations,
				"processing_steps": self.processing_steps,
				"timestamp": datetime.now().isoformat(),
			}

		except Exception as e:
			logger.error(f"Error in advice agent chain: {str(e)}")
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Agent chain processing failed: {str(e)}",
			)


# Initialize the orchestrator
orchestrator = AgentChainOrchestrator()


@router.post("/process", response_model=AdviceResponse)
async def process_medical_report(file: UploadFile = File(...)):
	"""
	Endpoint that chains validator -> summarizer -> advisor -> tone checker using a file upload.
	"""
	try:
		file_content = await file.read()
		medical_report = file_content.decode("utf-8")

		if not medical_report.strip():
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Medical report file cannot be empty",
			)

		logger.info(f"[advice] Processing medical report of length: {len(medical_report)}")

		result = orchestrator.process_medical_report(medical_report=medical_report)

		logger.info("[advice] Agent chain processing completed successfully")

		return AdviceResponse(**result)

	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"Unexpected error in process_medical_report: {str(e)}")
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Internal server error occurred during processing",
		)


@router.post("/validate-only", response_model=ValidationResponse)
async def validate_medical_report(file: UploadFile = File(...)):
	"""
	Endpoint to run only the validation agent using a file upload.
	"""
	try:
		file_content = await file.read()
		medical_report = file_content.decode("utf-8")

		if not medical_report.strip():
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Medical report file cannot be empty",
			)

		logger.info(f"[advice] Validating medical report of length: {len(medical_report)}")

		validated_result: CleanedTextOutput = validate_report(medical_report)

		return ValidationResponse(cleaned_text=validated_result.cleaned_text)

	except Exception as e:
		logger.error(f"Error in validate_medical_report: {str(e)}")
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=f"Validation failed: {str(e)}",
		)


@router.get("/health")
async def health_check():
	return {
		"status": "healthy",
		"service": "advice_agent_chain",
		"timestamp": datetime.now().isoformat(),
		"available_agents": ["validator", "summarizer", "advisor", "tone_checker"],
	}

