# app/agents/advisor/general_medical_advisor.py

from langchain.chat_models import init_chat_model
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

load_dotenv()

# Initialize the LangChain model
model = init_chat_model("gemini-2.0-flash-exp", model_provider="google_genai")

# Comprehensive Pydantic model for detailed medical recommendations
class MedicalAdviceResult(BaseModel):
    clinical_interpretation: str
    urgency_level: str
    immediate_actions: List[Dict[str, str]]
    medication_recommendations: List[Dict[str, str]]
    lifestyle_modifications: Dict[str, List[str]]
    diagnostic_follow_up: List[Dict[str, str]]
    specialist_referrals: List[Dict[str, str]]
    monitoring_plan: Dict[str, str]
    patient_education: List[str]
    potential_complications: List[str]
    emergency_warning_signs: List[str]
    expected_timeline: Dict[str, str]
    evidence_basis: List[str]

parser = PydanticOutputParser(pydantic_object=MedicalAdviceResult)

prompt = ChatPromptTemplate.from_messages([
    ("system", 
     """You are an experienced primary care physician with 20+ years of clinical practice.
     Provide comprehensive, evidence-based medical recommendations for patients based on their medical reports.

     CRITICAL REQUIREMENTS FOR DEPTH:
     - Provide SPECIFIC, actionable recommendations with timelines and measurable goals
     - Include both pharmacological and non-pharmacological management strategies
     - Reference current clinical guidelines (USPSTF, specialty society guidelines)
     - Consider patient's complete clinical context, comorbidities, and social determinants
     - Provide contingency plans for treatment failure or adverse effects
     - Include specific monitoring parameters and follow-up intervals

     EXPECTED OUTPUT STRUCTURE:
     {format_instructions}

     EXAMPLE OF REQUIRED DEPTH:
     - Don't say "exercise more" → Specify: "Aerobic exercise 30 minutes, 5x/week, target HR 120-150 bpm, gradual progression"
     - Don't say "healthy diet" → Specify: "Mediterranean diet: 5 servings vegetables, 2 fruits daily, limit processed foods <10% calories"
     - Don't say "follow up" → Specify: "Follow up in 2 weeks for BP check, repeat lipids in 3 months, target LDL <100 mg/dL"

     Current Date: {current_date}"""),
    ("human", 
     """MEDICAL REPORT FOR REVIEW:
     {medical_report}

     PATIENT CONTEXT (if available):
     - Age: {age}
     - Gender: {gender}
     - Current Medications: {current_meds}
     - Known Allergies: {allergies}
     - Past Medical History: {past_history}
     - Social History: {social_history}
     - Family History: {family_history}

     Provide comprehensive medical management recommendations as the primary treating physician:""")
])

class GeneralMedicalAdvisor:
    def __init__(self):
        self.model = model
        self.parser = parser
        
    def get_comprehensive_advice(self, medical_report: str, 
                               age: Optional[int] = None,
                               gender: Optional[str] = None,
                               current_meds: Optional[str] = None,
                               allergies: Optional[str] = None,
                               past_history: Optional[str] = None,
                               social_history: Optional[str] = None,
                               family_history: Optional[str] = None):
        """
        Get comprehensive medical recommendations based on the medical report.
        """
        try:
            format_instructions = parser.get_format_instructions()
            current_date = datetime.now().strftime("%Y-%m-%d")
            
            messages = prompt.format_messages(
                medical_report=medical_report,
                age=age or "Not specified",
                gender=gender or "Not specified",
                current_meds=current_meds or "None reported",
                allergies=allergies or "None reported",
                past_history=past_history or "None reported",
                social_history=social_history or "Not specified",
                family_history=family_history or "Not specified",
                current_date=current_date,
                format_instructions=format_instructions
            )
            
            response = self.model.invoke(messages)
            parsed_response = parser.parse(response.content)
            
            return parsed_response
            
        except Exception as e:
            raise ValueError(f"Error generating medical advice: {str(e)}")

def provide_general_medical_advice(medical_report: str, **patient_context):
    advisor = GeneralMedicalAdvisor()
    return advisor.get_comprehensive_advice(medical_report, **patient_context)