import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "medscribe")

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.server_info()  # Force connection check
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"⚠️ MongoDB Atlas not reachable: {e}")
    print("➡️ Falling back to local MongoDB at mongodb://localhost:27017")
    client = MongoClient("mongodb://localhost:27017")

db = client[DB_NAME]

def get_users_collection():
    return db["users"]

def get_cases_collection():
    return db["cases"]

def get_conversations_collection():
    return db["conversations"]
