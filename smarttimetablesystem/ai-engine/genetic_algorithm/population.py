import random

from models.gene import Gene
from models.chromosome import Chromosome


def _group_timeslots_by_day(timeslots):
    """Group timeslots into {day: [timeslot_list]}."""
    by_day = {}
    for ts in timeslots:
        day = ts["id"].split("-")[0]
        if day not in by_day:
            by_day[day] = []
        by_day[day].append(ts)
    for day in by_day:
        by_day[day].sort(key=lambda t: t.get("slotNumber", 0))
    return by_day


def generate_random_chromosome(subjects, teachers, rooms, timeslots):
    """
    Generate a chromosome with even day distribution.
    Multi-class aware: different divisions can share timeslots (in different rooms
    with different teachers); the same division cannot have two subjects in the same slot.
    """

    genes = []

    used_teacher_slots = set()          # (teacher, timeslot) — teacher cannot be in two places
    used_room_slots = set()             # (room, timeslot) — room cannot host two lectures
    used_class_slots = set()            # (division, timeslot) — a division cannot have two subjects at once

    ts_by_day = _group_timeslots_by_day(timeslots)
    days = sorted(ts_by_day.keys())

    if not days:
        return Chromosome(genes)

    # Round-robin day assignment
    day_buckets = {day: [] for day in days}
    for i, subject in enumerate(subjects):
        target_day = days[i % len(days)]
        day_buckets[target_day].append(subject)

    for day in days:
        day_subjects = day_buckets[day]
        day_ts = ts_by_day.get(day, [])

        if not day_ts:
            continue

        for subject in day_subjects:

            branch = subject["branch"]
            division = subject.get("division", "A")
            subject_type = subject.get("type", "THEORY")
            teacher_id = subject["teacherId"]

            if subject_type == "LAB":

                lab_rooms = [r for r in rooms if r.get("type") == "LAB"]
                if not lab_rooms:
                    lab_rooms = rooms

                room = random.choice(lab_rooms)

                valid_pairs = []
                for idx in range(len(day_ts) - 1):
                    s1 = day_ts[idx].get("slotNumber", 0)
                    s2 = day_ts[idx + 1].get("slotNumber", 0)
                    if s2 == s1 + 1:
                        valid_pairs.append((day_ts[idx], day_ts[idx + 1]))

                if valid_pairs:
                    timeslot, next_slot = random.choice(valid_pairs)
                elif len(day_ts) >= 2:
                    timeslot, next_slot = day_ts[0], day_ts[1]
                else:
                    timeslot = random.choice(timeslots)
                    next_slot = timeslot

                timeslot_id = timeslot["id"]
                next_slot_id = next_slot["id"]

            else:
                room = random.choice(rooms)
                timeslot = random.choice(day_ts)
                timeslot_id = timeslot["id"]
                next_slot_id = None

            room_id = room["id"]

            # Conflict resolution — check per-division class conflicts + shared teacher/room conflicts
            attempts = 0
            while (
                    (division, timeslot_id) in used_class_slots or
                    (teacher_id, timeslot_id) in used_teacher_slots or
                    (room_id, timeslot_id) in used_room_slots
            ) and attempts < 25:

                if subject_type == "LAB":
                    room = random.choice(lab_rooms)
                    if valid_pairs:
                        timeslot, next_slot = random.choice(valid_pairs)
                    elif len(day_ts) >= 2:
                        timeslot, next_slot = day_ts[0], day_ts[1]
                    timeslot_id = timeslot["id"]
                    next_slot_id = next_slot["id"]
                else:
                    room = random.choice(rooms)
                    if attempts < 12 and day_ts:
                        timeslot = random.choice(day_ts)
                    else:
                        timeslot = random.choice(timeslots)
                    timeslot_id = timeslot["id"]
                    next_slot_id = None

                room_id = room["id"]
                attempts += 1

            # Save used slots
            used_class_slots.add((division, timeslot_id))
            used_teacher_slots.add((teacher_id, timeslot_id))
            used_room_slots.add((room_id, timeslot_id))

            if subject_type == "LAB" and next_slot_id:
                used_class_slots.add((division, next_slot_id))
                used_teacher_slots.add((teacher_id, next_slot_id))
                used_room_slots.add((room_id, next_slot_id))

            gene = Gene(
                subject["id"],
                teacher_id,
                room_id,
                timeslot_id,
                branch,
                division
            )

            genes.append(gene)

    return Chromosome(genes)


def generate_population(size, subjects, teachers, rooms, timeslots):
    population = []
    for _ in range(size):
        chromosome = generate_random_chromosome(subjects, teachers, rooms, timeslots)
        population.append(chromosome)
    return population