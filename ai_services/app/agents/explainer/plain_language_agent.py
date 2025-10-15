# app/agents/explainer/plain_language_agent.py
from langchain.chat_models import init_chat_model
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
import os
import getpass
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Dict

# Load environment variables from the .env file
load_dotenv()

# Access the GOOGLE_API_KEY environment variable
if not os.environ.get("GOOGLE_API_KEY"):
    google_api_key = os.getenv("GOOGLE_API_KEY") or getpass.getpass("Enter API key for Google Gemini: ")
    os.environ["GOOGLE_API_KEY"] = google_api_key

# Initialize the LangChain model
model = init_chat_model("gemini-2.5-flash-lite", model_provider="google_genai")

# Updated Pydantic model to match the actual output format
class PlainLanguageResult(BaseModel):
    explanation: Dict[str, str]  # Changed from str to Dict[str, str]

parser = PydanticOutputParser(pydantic_object=PlainLanguageResult)

# Updated prompt to be more specific about the format
prompt = ChatPromptTemplate.from_messages([
    ("system", 
     """You are an AI trained to explain complex medical terms in simple language.
     
     TASK: Extract and explain ONLY the medical terminology found in the report.
     Do NOT summarize the entire report. Do NOT provide diagnoses or interpretations.
     
     For each medical term you find, provide a simple, clear explanation (1-2 sentences).
     
     Return your response as a JSON object with three fields:
     1. "explanation": A dictionary where keys are medical terms and values are their explanations
     2. "sources": List any sources used (e.g., ["Medical dictionary"])
     3. "tools_used": List any tools used (e.g., ["Terminology database"])
     
     {format_instructions}
     
     Example format:
     {{
       "explanation": {{
         "Hypertension": "High blood pressure - a condition where...",
         "Diabetes": "A condition that affects blood sugar levels..."
       }},
       "sources": ["Medical dictionary"],
       "tools_used": ["Terminology database"]
     }}"""),
    ("human", "Please explain the medical terminology in this report:\n\n{medical_report}")
])

def process_medical_report(medical_report: str):
    """
    Takes in the medical report as input and returns explanations for medical terms.
    """
    try:
        # Format the prompt with the medical report
        format_instructions = parser.get_format_instructions()
        
        messages = prompt.format_messages(
            medical_report=medical_report,
            format_instructions=format_instructions
        )
        
        # Get response from the model
        response = model.invoke(messages)
        
        # Parse the response
        parsed_response = parser.parse(response.content)
        
        return parsed_response.explanation
        
    except Exception as e:
        raise ValueError(f"Error processing medical report: {str(e)}")