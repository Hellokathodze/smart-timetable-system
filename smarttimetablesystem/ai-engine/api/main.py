import warnings
import os

# Suppress sklearn/joblib parallel deprecation warnings globally
warnings.filterwarnings("ignore", message=".*sklearn.utils.parallel.delayed.*")
warnings.filterwarnings("ignore", message=".*joblib.*")
os.environ["PYTHONWARNINGS"] = "ignore::UserWarning"

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

from scheduler.timetable_generator import generate_timetable


app = FastAPI()


class GenerateRequest(BaseModel):
    teachers: List
    subjects: List
    rooms: List
    timeslots: List


# -----------------------------
# Root API
# -----------------------------
@app.get("/")
def home():
    return {"message": "AI Scheduler Running"}


# -----------------------------
# Favicon Fix
# -----------------------------
@app.get("/favicon.ico")
async def favicon():
    return {"message": "No favicon configured"}


# -----------------------------
# Generate Timetable API
# -----------------------------
@app.post("/generate")
def generate(data: GenerateRequest):

    print(" INPUT DATA FROM JAVA:")
    print(data.dict())

    result = generate_timetable(data.dict())

    return {
        "fitness": result["fitness"],
        "timetable": result["timetable"],
        "breakSlots": result.get("breakSlots", {})
    }
