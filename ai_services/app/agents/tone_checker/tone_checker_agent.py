# app/agents/tone_checker_agent.py
from langchain.chat_models import init_chat_model
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.agents import create_tool_calling_agent
from langchain.agents import AgentExecutor
from pydantic import BaseModel
import os
import getpass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Access the GOOGLE_API_KEY environment variable
google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter API key for Google Gemini: ")

# Initialize the Langchain model
model = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

class ToneFeedback(BaseModel):
    toned_message: str  # Modify to directly return the toned message

# Initialize the Pydantic parser
tone_parser = PydanticOutputParser(pydantic_object=ToneFeedback)

# Define the tone-checking prompt
tone_check_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", 
         "You are an AI trained to check and adjust the tone of messages. Your task is to analyze and soften the tone of the given message, ensuring it is clear, patient-friendly, and non-urgent. "
         "Please adjust the tone to make it suitable for a patient, simplifying technical language and reducing any urgency.\n\n"
         "Guidelines:\n"
         "1. Soften any urgent language and remove alarmist tones.\n"
         "2. Simplify any technical terms so the message is easier for a patient to understand.\n"
         "3. Use empathetic language that reassures the patient.\n"
         "4. Make sure the message is clear and calm.\n"
         """ 
            wrap the output in this format and provide no other text\n{format_instructions}
         """),
        ("human", "{query}"),
        ("placeholder", "{chat_history}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
).partial(format_instructions=tone_parser.get_format_instructions())

# Create the tone-checking agent
tone_check_agent = create_tool_calling_agent(
    llm=model,
    tools=[],
    prompt=tone_check_prompt,
)

# Create the agent executor for tone checking
tone_check_agent_chain = AgentExecutor.from_agent_and_tools(
    agent=tone_check_agent,
    tools=[],
    verbose=True,
)

# Function to get tone-neutralized message
def check_message_tone(message: str) -> str:
    """
    Takes in a message, adjusts its tone to be more patient-friendly, and returns the adjusted message.
    """
    # Prepare the query with the message content
    query = f"Please adjust the tone of the following message to be patient-friendly and clear:\n\n{message}"

    # Invoke the tone-checking agent with the query
    raw_response = tone_check_agent_chain.invoke({"query": query})

    # Check for the raw response to ensure there is no error
    if "output" not in raw_response:
        raise ValueError("Agent did not return a valid response.")

    # Parse the response from the agent to extract the toned message
    response = tone_parser.parse(raw_response["output"])

    # Return the toned message (neutralized recommendations)
    return response.toned_message
