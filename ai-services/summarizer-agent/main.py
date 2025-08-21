import os
from dotenv import load_dotenv
from google import genai

# Load environment variables from the .env file
load_dotenv()

# Get the GEMINI_API_KEY from environment variables
API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the client with the API key
client = genai.Client(api_key=API_KEY)

# Generate content using the Gemini model
response = client.models.generate_content(
    model="gemini-2.5-flash", contents="Explain how AI works in a few words"
)

# Print the response text
print(response.text)
