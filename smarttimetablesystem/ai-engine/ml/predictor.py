import joblib
import os
import pandas as pd


# -----------------------------------------
# Locate model file safely
# -----------------------------------------

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "timetable_model.pkl")


# -----------------------------------------
# Load ML model
# -----------------------------------------

model = joblib.load(MODEL_PATH)


# -----------------------------------------
# Prediction Function
# -----------------------------------------

def predict_demand(timeslot, teacher_load, room_utilization):

    # Create DataFrame with same feature names used during training
    data = pd.DataFrame([{
        "timeslot": timeslot,
        "teacher_load": teacher_load,
        "room_utilization": room_utilization
    }])

    prediction = model.predict(data)

    return prediction[0]