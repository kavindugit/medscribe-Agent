from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.routes.health import router as health_router
from app.routes.ingest import router as ingest_router
from app.routes.cases import router as cases_router
from app.routes.classifier import router as classifier_router
from app.routes.translator import router as translator_router
from app.routes.explain import router as explain_router
from app.routes.advisor import router as advisor_router
from app.chatbot.routes.rag import router as rag_chat_router
from app.routes.summarizer import router as summarizer_router
from app.routes.summary_route import router as summary_chain_router
from app.routes.advice_route import router as advisor_router
from app.routes.explaine_route import router as explain_router
from app.routes.classify_route import router as class_router
from app.routes.translate_adv_route import router as translate_advice_router
from app.routes.translate_sum_route import router as translate_summary_router
from app.routes.pipeline import router as pipeline_router
from app.routes.validator import router as validator_router
from app.vector.indexer import ensure_collection
from dotenv import load_dotenv
from app.routes.vector_cleanup import router as vector_cleanup_router


load_dotenv()
print("🔍 AZURE_OCR_URL:", os.getenv("AZURE_OCR_URL"))
print("🔍 AZURE_OCR_KEY:", os.getenv("AZURE_OCR_KEY")[:6] if os.getenv("AZURE_OCR_KEY") else None)
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
app.include_router(summary_chain_router)
app.include_router(translate_summary_router) 
app.include_router(class_router) # New agent chaining route
app.include_router(classifier_router)
app.include_router(translate_advice_router)
app.include_router(advisor_router)
app.include_router(explain_router)
app.include_router(validator_router)
app.include_router(pipeline_router)
app.include_router(vector_cleanup_router)  # Add this line to include the vector cleanup router
