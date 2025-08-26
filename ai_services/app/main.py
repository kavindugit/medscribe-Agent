from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.ingest import router as ingest_router
from app.routes.cases import router as cases_router
from app.routes.chat import router as chat_router
from app.routes.users import router as users_router
from app.routes.classifier import router as classifier_router


from dotenv import load_dotenv
load_dotenv()



app = FastAPI(title="ai_services")

app.include_router(health_router)
app.include_router(ingest_router)
app.include_router(cases_router)
app.include_router(chat_router)
app.include_router(users_router)
app.include_router(classifier_router)



