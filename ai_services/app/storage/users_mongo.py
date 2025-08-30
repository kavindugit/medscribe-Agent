# app/storage/users_mongo.py
from app.storage.mongo_client import get_users_collection

def save_user(user: dict):
    """Insert or update a user document"""
    users = get_users_collection()
    users.update_one({"_id": user["_id"]}, {"$set": user}, upsert=True)

def get_user(user_id: str):
    """Fetch a single user"""
    users = get_users_collection()
    return users.find_one({"_id": user_id})

def get_all_users():
    """Fetch all users"""
    users = get_users_collection()
    return list(users.find())
