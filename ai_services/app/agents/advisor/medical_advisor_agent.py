# Import necessary modules
from langchain.chat_models import init_chat_model
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.agents import create_tool_calling_agent
from langchain.agents import AgentExecutor
from pydantic import BaseModel
import os
import getpass
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Access the GOOGLE_API_KEY environment variable
google_api_key = os.getenv("GOOGLE_API_KEY")
# Load environment variables
if not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter API key for Google Gemini: ")

# Initialize the Langchain model
model = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

class RecommendationResult(BaseModel):
    recommendations: str

# Initialize the Pydantic parser
parser = PydanticOutputParser(pydantic_object=RecommendationResult)

# Define the recommendation prompt template
recommendation_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", 
         "You are an AI trained to provide expert recommendations based on the content of medical reports. "
         "Your task is to carefully analyze the provided content and offer professional advice or recommendations based on the report's findings.\n\n"
         "Guidelines:\n"
         "1. Analyze the medical report carefully and provide actionable recommendations or insights.\n"
         "2. Your recommendations should be based strictly on the content of the report, without making any assumptions.\n"
         "3. If the report lacks details or contains ambiguous sections, acknowledge those gaps and provide recommendations based on the available information.\n"
         "4. If there are any areas that require further clarification or testing, suggest appropriate next steps.\n"
         "5. Make sure your language is clear, professional, and appropriate for medical or business context.\n"
         "6. If the report includes complex medical terminology, offer recommendations in a simplified and accessible way.\n"
         "7. Provide recommendations that focus on the immediate next steps or long-term considerations.\n"
         """ 
            wrap the output in this format and provide no other text\n{format_instructions}
         """),
        ("human", "{query}"),
        ("placeholder", "{chat_history}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
).partial(format_instructions=parser.get_format_instructions())

# Create the agent for recommendations
llm = model
recommendation_agent = create_tool_calling_agent(
    llm=llm,
    tools=[],
    prompt=recommendation_prompt,
)

# Create the agent executor for recommendation
recommendation_agent_chain = AgentExecutor.from_agent_and_tools(
    agent=recommendation_agent,
    tools=[],
    verbose=True,
)

# Function to get recommendations from the report
def get_report_recommendations(medical_report: str):
    """
    Takes in the medical report as input and returns expert recommendations.
    This function sends the medical report to the recommendation agent for analysis
    and parses the response.
    """
    # Prepare the query with the loaded report content
    query = f"Provide recommendations based on the following medical report:\n\n{medical_report}"

    # Invoke the recommendation agent with the query
    raw_response = recommendation_agent_chain.invoke({"query": query})

    # Check for the raw response to ensure there is no error
    if "output" not in raw_response:
        raise ValueError("Agent did not return a valid response.")

    # Parse the response from the agent
    response = parser.parse(raw_response["output"])

    # Return the recommendations
    return response.recommendations
