import warnings
warnings.filterwarnings("ignore", message=".*sklearn.utils.parallel.delayed.*")
warnings.filterwarnings("ignore", message=".*joblib.*")

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib


def train():

    df = pd.read_csv("ml_dataset.csv")

    X = df[[
        "timeslot",
        "teacher_load",
        "room_utilization"
    ]]

    y = df["high_demand"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2
    )

    model = RandomForestClassifier()

    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)

    print("Model accuracy:", accuracy)

    joblib.dump(model, "timetable_model.pkl")


if __name__ == "__main__":
    train()