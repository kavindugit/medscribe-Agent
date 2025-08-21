from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app import report_analyzer

app = FastAPI(title="MedScribe Member C (Gemini)")

# Allow local frontend (adjust origins if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "MedScribe Member C backend running (Gemini)"}

@app.post("/analyze-report/")
async def analyze_report(file: UploadFile = File(...)):
    try:
        result = await report_analyzer.process_report(file)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"ok": True}
