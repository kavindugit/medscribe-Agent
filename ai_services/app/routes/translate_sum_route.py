from fastapi import APIRouter, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime

# Import the agents
from app.agents.validator.validator import validate_report, CleanedTextOutput
from app.agents.summarizer.summarizer import summarize_report
from app.agents.tone_checker.tone_checker_agent import check_message_tone
from app.agents.translator.translator_agent import translate_report

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/translate-summary", tags=["translate-summary"])


# Request/Response Models
class SummaryRequest(BaseModel):
	include_tone_check: Optional[bool] = True


class ValidationResponse(BaseModel):
	cleaned_text: str


class TranslateSummaryResponse(BaseModel):
	original_text: str
	validated_text: str
	summary: str
	sources: List[str]
	tools_used: List[str]
	toned_summary: Optional[str] = None
	translation: str
	processing_steps: Dict[str, Any]
	timestamp: str


class AgentChainOrchestrator:
	"""
	Orchestrator for translate-summary chain:
	1) Validator -> clean text
	2) Summarizer -> create summary, sources, tools
	3) Tone checker (optional) -> patient-friendly summary
	4) Translator -> translate final summary to Sinhala
	"""

	def __init__(self):
		self.processing_steps = {}

	def process_medical_report(self, medical_report: str, include_tone_check: bool = True) -> Dict[str, Any]:
		try:
			# Step 1: Validate
			logger.info("[translate-summary] Starting validation step…")
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

			# Step 2: Summarize
			logger.info("[translate-summary] Starting summarization step…")
			summary_start = datetime.now()

			summary, sources, tools_used = summarize_report(validated_text)

			summary_end = datetime.now()
			self.processing_steps["summarization"] = {
				"status": "completed",
				"duration_seconds": (summary_end - summary_start).total_seconds(),
				"sources_found": len(sources),
				"tools_used": tools_used,
			}

			# Step 3: Tone check (optional)
			toned_summary = None
			if include_tone_check:
				logger.info("[translate-summary] Starting tone checking step…")
				tone_start = datetime.now()

				toned_summary = check_message_tone(summary)

				tone_end = datetime.now()
				self.processing_steps["tone_checking"] = {
					"status": "completed",
					"duration_seconds": (tone_end - tone_start).total_seconds(),
					"original_summary_length": len(summary),
					"toned_summary_length": len(toned_summary),
				}
			else:
				self.processing_steps["tone_checking"] = {
					"status": "skipped",
					"reason": "include_tone_check set to False",
				}

			# Step 4: Translate final summary (toned if available, else original summary)
			logger.info("[translate-summary] Starting translation step…")
			translate_start = datetime.now()

			final_summary_for_translation = toned_summary if toned_summary else summary
			translation = translate_report(final_summary_for_translation)

			translate_end = datetime.now()
			self.processing_steps["translation"] = {
				"status": "completed",
				"duration_seconds": (translate_end - translate_start).total_seconds(),
				"input_length": len(final_summary_for_translation),
				"output_length": len(translation),
			}

			return {
				"original_text": medical_report,
				"validated_text": validated_text,
				"summary": summary,
				"sources": sources,
				"tools_used": tools_used,
				"toned_summary": toned_summary,
				"translation": translation,
				"processing_steps": self.processing_steps,
				"timestamp": datetime.now().isoformat(),
			}

		except Exception as e:
			logger.error(f"Error in translate-summary agent chain: {str(e)}")
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Agent chain processing failed: {str(e)}",
			)


# Initialize the orchestrator
orchestrator = AgentChainOrchestrator()


@router.post("/process", response_model=TranslateSummaryResponse)
async def process_medical_report(file: UploadFile = File(...), include_tone_check: Optional[bool] = True):
	"""
	Endpoint that chains validator -> summarizer -> tone checker (optional) -> translator using a file upload.
	"""
	try:
		file_content = await file.read()
		medical_report = file_content.decode("utf-8")

		if not medical_report.strip():
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Medical report file cannot be empty",
			)

		logger.info(f"[translate-summary] Processing medical report of length: {len(medical_report)}")

		result = orchestrator.process_medical_report(
			medical_report=medical_report,
			include_tone_check=include_tone_check,
		)

		logger.info("[translate-summary] Agent chain processing completed successfully")

		return TranslateSummaryResponse(**result)

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

		logger.info(f"[translate-summary] Validating medical report of length: {len(medical_report)}")

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
		"service": "translate_summary_agent_chain",
		"timestamp": datetime.now().isoformat(),
		"available_agents": ["validator", "summarizer", "tone_checker", "translator"],
	}

