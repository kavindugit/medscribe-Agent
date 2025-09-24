from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.ingest import router as ingest_router
from app.routes.cases import router as cases_router
from app.routes.classifier import router as classifier_router
from app.routes.translator import router as translator_router
from app.routes.explain import router as explain_router
from app.routes.advisor import router as advisor_router
from app.chatbot.routes.rag import router as rag_chat_router
from app.routes.summarizer import router as summarizer_router
from app.routes.pipeline import router as pipeline_router
from app.vector.indexer import ensure_collection
from dotenv import load_dotenv


load_dotenv()

ensure_collection()

app = FastAPI(title="ai_services")


origins = [
    "http://localhost:5173",  
    "http://localhost:4000",  
    "http://localhost:8001", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     
    allow_credentials=True,
    allow_methods=["*"],       
    allow_headers=["*"],       
)

# Routers
app.include_router(health_router)
app.include_router(ingest_router)
app.include_router(cases_router)
app.include_router(translator_router)
app.include_router(explain_router)
app.include_router(advisor_router)
app.include_router(rag_chat_router)
app.include_router(summarizer_router)
app.include_router(classifier_router)
app.include_router(pipeline_router)
