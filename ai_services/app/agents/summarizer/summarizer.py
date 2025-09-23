# summarizer.py
import os
import getpass
from langchain.chat_models import init_chat_model
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.agents import create_tool_calling_agent
from langchain.agents import AgentExecutor
from pydantic import BaseModel

# Load environment variables
if not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter API key for Google Gemini: ")

# Initialize the Langchain model
model = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

class SummarizationOutput(BaseModel):
    summary: str
    sources: list[str]
    tools_used: list[str]

# Initialize Pydantic parser
parser = PydanticOutputParser(pydantic_object=SummarizationOutput)

# Define the prompt template
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", 
         "You are an AI trained to summarize medical reports. You will be provided with a cleaned medical report. Your task is to extract and present the most important details in a clear, concise summary. Here are the guidelines you must follow:\n\n"
         "1. Summarize the content of the report by capturing the key details, including but not limited to diagnoses, procedures, and important findings.\n"
         "2. Focus solely on the content of the provided report and do not add any information not present in the text.\n"
         "3. If the report is incomplete or ambiguous, note the areas where information is missing or unclear without making assumptions or adding extra information.\n"
         "4. In cases where the report includes unclear or contradictory information, mention that ambiguity exists and summarize the available details as accurately as possible.\n"
         "5. Avoid any medical advice, treatment recommendations, or further interpretation; simply summarize the facts as stated.\n"
         "6. If the report includes any medical jargon or complex terms, explain them in simple terms where necessary, but do not simplify the overall content too much.\n"
         "7. If the report contains multiple sections, ensure that all sections are summarized appropriately, even if some parts seem redundant or incomplete.\n"
         "8. If the report has missing data or any section appears to be incomplete, acknowledge these gaps and present what is available in the best possible way.\n"
         "9. Be clear, factual, and direct in your summary, ensuring that the most crucial points are prioritized.\n"
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

# Function to summarize the report
def summarize_report(medical_report: str):
    """
    Takes in the medical report as input and returns a summary.
    This function sends the medical report to the agent for summarization
    and parses the response.
    """
    # Prepare the query with the loaded report content
    query = f"Summarize the following medical report:\n\n{medical_report}"

    # Invoke the agent with the query
    raw_response = agent_chain.invoke({"query": query})

    # Check for the raw response to ensure there is no error
    if "output" not in raw_response:
        raise ValueError("Agent did not return a valid response.")

    # Parse the response from the agent
    response = parser.parse(raw_response["output"])

    # Return the summary, sources, and tools used
    return response.summary, response.sources, response.tools_used
