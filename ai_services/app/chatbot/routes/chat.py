from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.chatbot.orchestrator import build_chatbot_graph

# Initialize router with prefix
router = APIRouter(prefix="/chatbot")

# Initialize chatbot workflow once
chatbot_graph = build_chatbot_graph()

# Request schema
class ChatRequest(BaseModel):
    user_id: str
    message: str

# Response schema
class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Initial state for LangGraph
        initial_state = {
            "user_id": request.user_id,
            "query": request.message
        }

        # Run graph
        result = chatbot_graph.invoke(initial_state)

        # Extract response from state
        response = result.get("response", "Sorry, I could not process that request.")

        return ChatResponse(response=response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
