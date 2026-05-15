import random
import pandas as pd


def generate_dataset(num_samples=5000):

    subjects = ["AI", "DBMS", "Networks", "OS", "PythonLab", "IoTLab"]
    days = ["MON", "TUE", "WED", "THU", "FRI"]

    data = []

    for _ in range(num_samples):

        subject = random.choice(subjects)

        day = random.choice(days)

        timeslot = random.randint(1, 6)

        teacher_load = random.randint(1, 6)

        room_utilization = random.uniform(0.3, 0.9)

        demand_score = random.randint(0, 1)

        data.append({
            "subject": subject,
            "day": day,
            "timeslot": timeslot,
            "teacher_load": teacher_load,
            "room_utilization": room_utilization,
            "high_demand": demand_score
        })

    df = pd.DataFrame(data)

    df.to_csv("ml_dataset.csv", index=False)

    print("Dataset generated")


if __name__ == "__main__":
    generate_dataset()