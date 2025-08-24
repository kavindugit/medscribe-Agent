from pydantic import BaseModel
import os

class Settings(BaseModel):
    SERVICE_TOKEN: str = os.getenv("SERVICE_TOKEN", "dev-service-token")
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "25"))

settings = Settings()
