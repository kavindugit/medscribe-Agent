import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "medscribe")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

def get_users_collection():
    return db["users"]

def get_cases_collection():
    return db["cases"]

def get_conversations_collection():   # ✅ new
    return db["conversations"]