from typing import Dict, Any
import os
try:
    from google import genai
except ImportError:
    genai = None
from app.config import settings
import json
import logging

logger = logging.getLogger(__name__)

MODEL_NAME = "gemini-2.0-flash-exp"  # Change this to the correct Gemini model if needed

class ClassifierAgent:
    """
    Medical Lab Report Analyzer Agent.
    Analyzes any text containing lab results and provides patient-friendly health insights.
    """
    
    def __init__(self):
        if genai is None:
            raise ImportError("Google Generative AI package not installed. Please install with: pip install google-generativeai")
        
        # Set the API key as environment variable for the genai client
        if settings.GEMINI_API_KEY:
            os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
        else:
            raise ValueError("GEMINI_API_KEY not found in environment variables. Please set your Gemini API key.")
        
        try:
            self.client = genai.Client()
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {str(e)}")
            raise ValueError(f"Failed to initialize Gemini client. Please check your GEMINI_API_KEY: {str(e)}")
    
    async def analyze_lab_report(self, report_text: str) -> Dict[str, Any]:
        """
        Analyze any free-form text (not just fixed format) and provide patient-friendly health insights.
        
        Args:
            report_text: Any text containing lab results, values, and medical data
            
        Returns:
            Dictionary with analysis results and patient-friendly explanations
        """
        try:
            prompt = f"""
You are a medical expert. Analyze the following text, which may contain medical lab results, numbers, or health information in any format (not just a table or list).

Your job:
1. Extract all numerical lab values and health-related numbers from the text, even if the format is messy or free-form.
2. For each value, classify as Normal, Borderline, or Abnormal (use standard medical reference ranges if possible).
3. For each value, provide a patient-friendly explanation in simple language.
4. Give an overall health assessment and actionable recommendations.
5. If no lab values are found, say so, but still provide any general health advice you can.

Text to analyze:
{report_text}

Respond ONLY in valid JSON with this structure:
{{
    "overall_assessment": {{
        "status": "Good/Fair/Concerning/Critical",
        "summary": "Brief overall health summary in simple terms"
    }},
    "test_results": [
        {{
            "test_name": "Name of the test or value (if found)",
            "value": "The numerical value found",
            "unit": "Unit if available",
            "classification": "Normal/Borderline Low/Borderline High/Abnormal Low/Abnormal High",
            "explanation": "What this means in simple terms",
            "patient_friendly_meaning": "What this result means for the patient's health in everyday language",
            "concern_level": "Low/Medium/High"
        }}
    ],
    "recommendations": [
        "List of actionable recommendations for the patient"
    ],
    "when_to_see_doctor": {{
        "urgency": "Not needed/Routine checkup/Soon/Immediately",
        "reason": "Explanation of why and when to see a doctor"
    }},
    "health_tips": [
        "General health tips based on the results or text"
    ]
}}
If you cannot find any lab values, return an empty test_results list but still fill out the other fields.
"""
            response = await self._get_gemini_response(prompt)
            try:
                return json.loads(response)
            except Exception as json_err:
                logger.error(f"Gemini response not valid JSON: {response}")
                logger.error(f"JSON parsing error: {json_err}")
                return {
                    "overall_assessment": {
                        "status": "Unable to analyze",
                        "summary": "Gemini did not return valid JSON. Please try again with a different input."
                    },
                    "test_results": [],
                    "recommendations": ["Please have a healthcare professional review your lab results."],
                    "when_to_see_doctor": {
                        "urgency": "Soon",
                        "reason": "Unable to properly analyze the results due to technical issues."
                    },
                    "health_tips": []
                }
        except Exception as e:
            logger.error(f"Error analyzing lab report: {str(e)}")
            return {
                "overall_assessment": {
                    "status": "Unable to analyze",
                    "summary": "There was an error analyzing your lab report. Please consult with a healthcare professional."
                },
                "test_results": [],
                "recommendations": ["Please have a healthcare professional review your lab results."],
                "when_to_see_doctor": {
                    "urgency": "Soon",
                    "reason": "Unable to properly analyze the results due to technical issues."
                },
                "health_tips": []
            }
    
    async def _get_gemini_response(self, prompt: str) -> str:
        """Get response from Gemini API."""
        try:
            response = self.client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            )
            logger.error(f"Gemini raw response: {response}")  # Log the raw Gemini response
            if response and hasattr(response, 'text') and response.text:
                return response.text.strip()
            else:
                logger.error(f"Gemini returned empty or invalid response: {response}")
                raise Exception("Empty response from Gemini API")
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}", exc_info=True)
            raise

def test_gemini_api():
    """Test Gemini API connectivity with a simple prompt."""
    try:
        agent = ClassifierAgent()
        import asyncio
        async def run():
            prompt = "Say hello from Gemini."
            response = await agent._get_gemini_response(prompt)
            print("Gemini API test response:", response)
        asyncio.run(run())
    except Exception as e:
        print("Gemini API test failed:", e)

# To run this test, open a Python shell and run:
# from app.agents.classifier_agent import test_gemini_api
# test_gemini_api()
