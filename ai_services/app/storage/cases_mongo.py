# app/storage/cases_mongo.py
from app.storage.mongo_client import get_cases_collection

def save_case_mongo(case: dict):
    """Insert a new case metadata into MongoDB"""
    cases = get_cases_collection()
    cases.insert_one(case)

def get_latest_case(user_id: str):
    """Fetch the most recent case for a user"""
    cases = get_cases_collection()
    return cases.find_one(
        {"user_id": user_id},
        sort=[("uploaded_at", -1)]
    )

def get_all_cases(user_id: str):
    """Fetch all cases for a user, sorted newest → oldest"""
    cases = get_cases_collection()
    return list(cases.find({"user_id": user_id}).sort("uploaded_at", -1))

def get_case_by_id(case_id: str):
    """Fetch a case by case_id"""
    cases = get_cases_collection()
    return cases.find_one({"_id": case_id})
