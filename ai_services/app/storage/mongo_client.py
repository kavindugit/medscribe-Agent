import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "medscribe")

# ✅ Establish connection
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.server_info()  # Test connection
    print("✅ Connected to MongoDB Atlas")
except Exception as e:
    print(f"⚠️ MongoDB Atlas not reachable: {e}")
    print("➡️ Falling back to local MongoDB at mongodb://localhost:27017")
    client = MongoClient("mongodb://localhost:27017")

# ✅ Select database
db = client[DB_NAME]

# -------------------------------
# Collection Getter Functions
# -------------------------------

def get_users_collection():
    """Return users collection."""
    return db["users"]

def get_cases_collection():
    """Return medical report cases collection."""
    return db["cases"]

def get_conversations_collection():
    """Return conversations collection for chat history."""
    return db["conversations"]

def get_insights_history_collection():
    """Return insights history collection."""
    return db["insights_history"]

