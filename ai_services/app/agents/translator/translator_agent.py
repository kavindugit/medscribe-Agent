import os
import getpass
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.agents import create_tool_calling_agent
from langchain.agents import AgentExecutor
from pydantic import BaseModel

# Load environment variables from the .env file
load_dotenv()

# Access the GOOGLE_API_KEY environment variable
google_api_key = os.getenv("GOOGLE_API_KEY")
# Load environment variables
if not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter API key for Google Gemini: ")

# Initialize the Langchain model
model = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

class TranslationResult(BaseModel):
    translation: str
    sources: list[str]
    tools_used: list[str]

# Initialize Pydantic parser
parser = PydanticOutputParser(pydantic_object=TranslationResult)

# Define the prompt template
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", 
         "You are an AI trained to translate text into Sinhala. You will be provided with a cleaned text in English. Your task is to translate the content into Sinhala. Here are the guidelines you must follow:\n\n"
         "1. Translate the content faithfully, ensuring that the meaning is preserved in Sinhala.\n"
         "2. Focus solely on translating the provided text without adding any additional information.\n"
         "3. If the text is incomplete or ambiguous, translate the available content and acknowledge any missing or unclear parts in your translation.\n"
         "4. Do not make assumptions or add extra information; just translate the text as accurately as possible.\n"
         "5. If the text includes any complex terms, make sure to provide an accurate translation while maintaining the original meaning.\n"
         "6. If the text contains multiple sections, ensure that each part is translated appropriately, even if some parts seem redundant or incomplete.\n"
         "7. If the content contains missing data or incomplete sections, acknowledge these gaps and translate what is available.\n"
         "8. Ensure that the translated content is clear, natural, and fluent in Sinhala.\n"
         """ 
            wrap the output in this format and provide no other text\n{format_instructions}
         """),
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

AgentExecutor = AgentExecutor(agent=agent, tools=[], verbose=True)

# Function to summarize the report
def translate_report(medical_report: str):
    """
    Takes in the medical report as input and returns a translation.
    This function sends the medical report to the agent for translation
    and parses the response.
    """
    # Prepare the query with the loaded report content
    query = f"Translate the following medical report:\n\n{medical_report}"

    # Invoke the agent with the query
    raw_response = agent_chain.invoke({"query": query})

    # Check for the raw response to ensure there is no error
    if "output" not in raw_response:
        raise ValueError("Agent did not return a valid response.")

    # Parse the response from the agent
    response = parser.parse(raw_response["output"])

    # Return the summary, sources, and tools used
    return response.translation, response.sources, response.tools_used