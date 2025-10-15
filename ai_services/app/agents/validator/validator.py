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
model = init_chat_model("gemini-2.5-flash-lite", model_provider="google_genai")

# Define the output model (cleaned text)
class CleanedTextOutput(BaseModel):
    cleaned_text: str  # Cleaned and standardized text

# Initialize Pydantic parser
parser = PydanticOutputParser(pydantic_object=CleanedTextOutput)

# Define the prompt template for cleaning (validation agent)
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", 
         "You are an AI trained to preprocess and clean raw medical report text. Your task is to:\n\n"
         "1. Standardize all numerical values and units, making them consistent.\n"
         "2. For units, ensure they are uniform (e.g., convert cholesterol to mmol/L or mg/dL consistently).\n"
         "3. Provide explanations and clarifications for numerical values, but **do not remove or alter** any information.\n"
         "4. If a unit conversion is made, indicate the conversion (e.g., 'Cholesterol: 5.94 mmol/L (converted from 230 mg/dL)').\n"
         "5. Ensure the text is easier to understand for downstream agents (summarizers, translators), but **do not remove** any content.\n"
         "6. Provide a cleaned version of the text with standardized values and units, but keep all the original content.\n\n"
         "Format your output as follows:\n{format_instructions}"
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
    verbose=False,  # Disable verbosity for clean output
)

# Function to clean and preprocess the report (validation agent)
def validate_report(medical_report: str) -> CleanedTextOutput:
    """
    Takes in the raw medical report, cleans and standardizes values and units,
    and returns the cleaned text without removing any original details.
    """
    # Prepare the query with the loaded report content
    query = f"Clean and preprocess the following medical report:\n\n{medical_report}"

    # Invoke the agent with the query
    raw_response = agent_chain.invoke({"query": query})

    # Check for the raw response to ensure there is no error
    if "output" not in raw_response:
        raise ValueError("Agent did not return a valid response.")

    # Parse the response from the agent
    response = parser.parse(raw_response["output"])

    # Return the cleaned version of the medical report text
    return response