"""
Shared utilities for the Phase 5 benchmark harness.

Contains:
- Synthetic instance generator (Small / Medium / Large tiers)
- Independent violation counters (not derived from fitness)
- Instance size configurations

Phase 5 tuning:
- Teacher assignment is now capped (each teacher gets at most
  ceil(subjects/teachers) subjects) to avoid artificial cross-division
  conflicts from random-with-replacement assignment.
- Instance sizes retuned to span solvable-to-hard difficulty range.
"""

import random


# -------------------------------------------------
# Instance size specifications
# -------------------------------------------------
INSTANCES = {
    "Small": {
        "divisions": [("CE", "A"), ("CE", "B")],
        "n_teachers": 15,
        "n_theory_per_div": 4,
        "n_lab_per_div": 2,
        "n_classrooms": 6,
        "n_lab_rooms": 3,
    },
    "Medium": {
        "divisions": [("CE", "A"), ("CE", "B"), ("IT", "A")],
        "n_teachers": 30,
        "n_theory_per_div": 4,
        "n_lab_per_div": 2,
        "n_classrooms": 9,
        "n_lab_rooms": 4,
    },
    "Large": {
        "divisions": [("CE", "A"), ("CE", "B"), ("IT", "A"), ("IT", "B")],
        "n_teachers": 40,
        "n_theory_per_div": 4,
        "n_lab_per_div": 2,
        "n_classrooms": 12,
        "n_lab_rooms": 6,
    },
}


DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
TIMES = [
    ("09:00", "10:00"),
    ("10:00", "11:00"),
    ("11:15", "12:15"),
    ("12:15", "13:15"),
    ("14:00", "15:00"),
    ("15:00", "16:00"),
]


def make_timeslots():
    """Standard 5-day, 6-slot-per-day timetable."""
    ts = []
    for d in DAYS:
        for i, (s, e) in enumerate(TIMES):
            n = i + 1
            ts.append({
                "id": f"{d}-{n}",
                "day": d,
                "slotNumber": n,
                "startTime": s,
                "endTime": e,
            })
    return ts


def build_instance(size, seed):
    """
    Deterministically build a synthetic instance for the given size and seed.

    Phase 5 fix: teacher assignment uses capped round-robin (each teacher
    gets at most ceil(subjects/teachers) subjects) instead of random-with-
    replacement. This reflects real universities where teachers are
    subject-specialists, not fungible resources.
    """
    if size not in INSTANCES:
        raise ValueError(f"Unknown instance size: {size}")

    cfg = INSTANCES[size]
    rnd = random.Random(seed)

    # Teachers
    teachers = [
        {"id": f"T{i+1}", "maxLoad": 12}
        for i in range(cfg["n_teachers"])
    ]

    # Capped teacher assignment: each teacher gets at most
    # ceil(n_subjects_total / n_teachers) subjects.
    n_subj_total = len(cfg["divisions"]) * (
        cfg["n_theory_per_div"] + cfg["n_lab_per_div"]
    )
    teacher_pool = teachers * ((n_subj_total // cfg["n_teachers"]) + 1)
    rnd.shuffle(teacher_pool)
    teacher_pool = teacher_pool[:n_subj_total]

    # Subjects — for each division, N theory + N lab subjects
    subjects = []
    ti = 0
    for div_idx, (branch, div) in enumerate(cfg["divisions"]):
        for k in range(cfg["n_theory_per_div"]):
            subjects.append({
                "id": f"{branch}{div}-TH{k+1}",
                "name": f"Theory{k+1}",
                "branch": branch,
                "division": div,
                "type": "THEORY",
                "weeklyHours": 3,
                "teacherId": teacher_pool[ti]["id"],
            })
            ti += 1
        for k in range(cfg["n_lab_per_div"]):
            subjects.append({
                "id": f"{branch}{div}-LAB{k+1}",
                "name": f"Lab{k+1}",
                "branch": branch,
                "division": div,
                "type": "LAB",
                "weeklyHours": 2,
                "teacherId": teacher_pool[ti]["id"],
            })
            ti += 1

    # Rooms
    rooms = [
        {"id": f"R{i+1}", "type": "CLASSROOM", "capacity": 60}
        for i in range(cfg["n_classrooms"])
    ]
    rooms += [
        {"id": f"LR{i+1}", "type": "LAB", "capacity": 30}
        for i in range(cfg["n_lab_rooms"])
    ]

    timeslots = make_timeslots()

    return {
        "teachers": teachers,
        "subjects": subjects,
        "rooms": rooms,
        "timeslots": timeslots,
    }


# -------------------------------------------------
# Independent constraint counters
# (do NOT derive from fitness — audit the output separately)
# -------------------------------------------------

def count_violations(timetable, subject_types, room_types, break_map=None):
    """
    Count constraint violations in a generated timetable.

    Follows ITC-2007 convention: hard violations = Distance to Feasibility,
    soft violations as tiebreaker for solution quality.

    Returns dict with hard/soft breakdown.
    """
    hard = {
        "teacher_clash": 0,
        "room_clash": 0,
        "class_slot_clash": 0,
        "break_slot": 0,
        "lab_in_non_lab": 0,
    }
    soft = {
        "theory_in_lab": 0,
    }

    teacher_slot = {}
    room_slot = {}
    class_slot = {}
    break_map = break_map or {}

    for entry in timetable:
        subject = entry["subject"]
        teacher = entry["teacher"]
        room = entry["room"]
        timeslot = entry["timeslot"]
        division = (entry["branch"], entry["division"])

        try:
            day, slot_num = timeslot.split("-")
            slot_num = int(slot_num)
        except Exception:
            continue

        # Hard: teacher clash
        key = (teacher, timeslot)
        if key in teacher_slot:
            hard["teacher_clash"] += 1
        else:
            teacher_slot[key] = True

        # Hard: room clash
        key = (room, timeslot)
        if key in room_slot:
            hard["room_clash"] += 1
        else:
            room_slot[key] = True

        # Hard: same division in same slot
        key = (division, timeslot)
        if key in class_slot:
            hard["class_slot_clash"] += 1
        else:
            class_slot[key] = True

        # Hard: lecture in a break slot
        if day in break_map and slot_num == break_map[day]:
            hard["break_slot"] += 1

        # Hard: lab subject in non-lab room
        s_type = subject_types.get(subject, "THEORY")
        r_type = room_types.get(room, "CLASSROOM")
        if s_type == "LAB" and r_type != "LAB":
            hard["lab_in_non_lab"] += 1
        elif s_type == "THEORY" and r_type == "LAB":
            soft["theory_in_lab"] += 1

    return {
        "hard_total": sum(hard.values()),
        "soft_total": sum(soft.values()),
        "hard_breakdown": hard,
        "soft_breakdown": soft,
    }