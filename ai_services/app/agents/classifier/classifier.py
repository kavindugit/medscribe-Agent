# app/agents/classifier/classifier.py
import os
import getpass
from langchain.chat_models import init_chat_model
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.agents import create_tool_calling_agent
from langchain.agents import AgentExecutor
from pydantic import BaseModel
from typing import Dict, List


# Load environment variables
if not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter API key for Google Gemini: ")

# Initialize the Langchain model
model = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

class DomainClassification(BaseModel):
    level: str
    explanation: str

class ClassifierOutput(BaseModel):
    domain_classifications: Dict[str, DomainClassification]
    overall_classification: str
    missing_data: List[str]
    confidence: float
    sources: List[str]
    tools_used: List[str]
# Initialize Pydantic parser
parser = PydanticOutputParser(pydantic_object=ClassifierOutput)

# Define the prompt template
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", 
         "You are an AI trained to classify patients’ health status across multiple domains "
         "based on cleaned medical reports. Your task is to provide a structured classification "
         "for each relevant health domain and an overall classification. Follow these guidelines:\n\n"
         
         "1. Health domains to classify (use only those supported by available data):\n"
         "   - **Diabetes/Glucose Control**\n"
         "   - **Cholesterol / Lipid Profile**\n"
         "   - **Blood Pressure / Hypertension**\n"
         "   - **Weight / BMI**\n"
         "   - **Cardiac Symptoms**\n"
         "   - **Kidney Function**\n"
         "   - **Liver Function**\n"
         "   - **Respiratory Status**\n"
         "   - **Infection / Inflammation**\n"
         "   - **Mental Health / Cognition**\n"
         "   - **Cancer / Oncology**\n"
         "   - **Other Notable Conditions** (catch-all for anything not covered above)\n\n"
         
         "2. Classification levels within each domain:\n"
         "   - **Normal / Controlled**\n"
         "   - **Mildly Abnormal / At Risk**\n"
         "   - **Moderately Abnormal / Needs Management**\n"
         "   - **Severely Abnormal / High Risk**\n"
         "   - **Unclear / Insufficient Data**\n\n"
         
         "3. For each domain present:\n"
         "   - Assign a classification level.\n"
         "   - Provide a short explanation referencing specific report findings.\n"
         "   - If no relevant information is available, mark it as 'Unclear / Insufficient Data'.\n\n"
         
         "4. Provide an **overall classification** based on the combined domain assessments. "
         "Overall categories are: Healthy, Mild Condition, Moderate Condition, Severe Condition, "
         "or Unclear/Insufficient Data.\n\n"
         
         "5. Always include a section for **missing_data** where you list what information was "
         "missing that could have improved classification confidence.\n\n"
         
         "6. Base the classification strictly on facts from the report. "
         "Do not assume, speculate, or provide medical advice/treatment recommendations.\n\n"
         
         "7. Use clear, factual, and concise language.\n\n"
         
         "8. Output format must strictly follow this schema:\n"
         "{format_instructions}"
        ),
        ("human", "{query}"),
        ("placeholder", "{chat_history}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
).partial(format_instructions=parser.get_format_instructions())

# Create the agent
llm = model
agent = create_tool_calling_agent(
    llm=llm,
    tools=[],
    prompt=prompt,
)

# Create the agent executor
agent_chain = AgentExecutor.from_agent_and_tools(
    agent=agent,
    tools=[],
    verbose=True,
)

# Function to classify the report
def classify_report(medical_report: str):
    """
    Takes in the medical report as input and returns a classification.
    This function sends the medical report to the agent for classification
    and parses the response.
    """
    # Prepare the query with the loaded report content
    query = f"Classify the following medical report:\n\n{medical_report}"

    # Invoke the agent with the query
    raw_response = agent_chain.invoke({"query": query})

    # Check for the raw response to ensure there is no error
    if "output" not in raw_response:
        raise ValueError("Agent did not return a valid response.")

    # Parse the response from the agent
    response = parser.parse(raw_response["output"])

    # Return the classification, sources, and tools used
    return response


