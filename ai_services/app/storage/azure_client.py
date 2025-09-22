# app/storage/azure_client.py
import os
import io
from datetime import datetime, timedelta
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv
load_dotenv()


# Load env
ACCOUNT_URL = os.getenv("AZURE_BLOB_ACCOUNT_URL")   # e.g. https://<account>.blob.core.windows.net
CONTAINER = os.getenv("AZURE_BLOB_CONTAINER", "medscribe")
SAS_TOKEN = os.getenv("AZURE_BLOB_SAS_TOKEN")       # long SAS string from .env

if not ACCOUNT_URL or not SAS_TOKEN:
    raise ValueError("❌ Azure SAS config not set in .env")

# Init with SAS credential
blob_service = BlobServiceClient(account_url=ACCOUNT_URL.split("?")[0], credential=SAS_TOKEN)
container_client = blob_service.get_container_client(CONTAINER)


def upload_file(blob_path: str, content: bytes, content_type: str = "application/octet-stream") -> str:
    """
    Upload a file to Azure Blob Storage at path inside the container.
    Returns the blob_path (Mongo stores relative path).
    """
    blob_client = container_client.get_blob_client(blob_path)
    blob_client.upload_blob(io.BytesIO(content), overwrite=True)
    return blob_path


def get_sas_url(blob_path: str) -> str:
    """
    Return a full SAS URL for accessing the blob.
    Uses the static SAS token from .env.
    """
    # ACCOUNT_URL already includes ?SAS_TOKEN if you configured like that
    base_url = ACCOUNT_URL.split("?")[0]  # ensure no duplicate
    return f"{base_url}/{CONTAINER}/{blob_path}?{SAS_TOKEN}"
