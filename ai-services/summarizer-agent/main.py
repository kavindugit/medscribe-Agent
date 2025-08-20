from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

load_dotenv()

llm = ChatOpenAI()

llm = ChatOpenAI(model = "gpt-4o")
response = llm.invoke("What is the capital of France?")
print(response)

