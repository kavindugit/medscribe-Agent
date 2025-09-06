from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.ingest import router as ingest_router
from app.routes.cases import router as cases_router
from app.routes.classifier import router as classifier_router
from app.routes.translator import router as translator_router
from app.chatbot.routes.chat import router as chatbot_router
from app.chatbot.routes.rag_chat import router as rag_chat_router   
from app.vector.indexer import ensure_collection
from dotenv import load_dotenv

load_dotenv()
ensure_collection()



app = FastAPI(title="ai_services")

app.include_router(health_router)
app.include_router(ingest_router)
app.include_router(cases_router)
app.include_router(classifier_router)
app.include_router(translator_router)
app.include_router(chatbot_router)
app.include_router(rag_chat_router)






