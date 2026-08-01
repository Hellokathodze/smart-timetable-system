import random


def repair_chromosome(chromosome, teachers, rooms, timeslots,
                      subject_types=None, room_types=None):
    """
    Repair a chromosome by resolving conflicts (teacher/room/division collisions).

    Type-aware room selection (Phase 2.5):
    If subject_types and room_types are provided, LAB subjects prefer LAB rooms.

    NOTE: The `timeslots` parameter passed here is ALREADY filtered to
    exclude break slots. Repairs will never place a gene into a break slot.
    """

    subject_types = subject_types or {}
    room_types = room_types or {}
    lab_rooms = [r for r in rooms if room_types.get(r["id"]) == "LAB"] or rooms
    classroom_rooms = [r for r in rooms if room_types.get(r["id"]) != "LAB"] or rooms

    teacher_timeslot = set()
    room_timeslot = set()
    division_timeslot = set()

    for gene in chromosome.genes:

        teacher = gene.teacherId
        room = gene.roomId
        timeslot = gene.timeslotId
        division = gene.division

        # Determine allowed room pool for this subject
        original_id = gene.subjectId.split("_dup")[0]
        subject_type = subject_types.get(original_id, "THEORY")
        room_pool = lab_rooms if subject_type == "LAB" else classroom_rooms

        conflict = (
                (teacher, timeslot) in teacher_timeslot or
                (room, timeslot) in room_timeslot or
                (division, timeslot) in division_timeslot
        )

        attempts = 0

        while conflict and attempts < 20:

            new_teacher = random.choice(teachers)["id"]
            new_room = random.choice(room_pool)["id"]
            new_timeslot = random.choice(timeslots)["id"]

            teacher = new_teacher
            room = new_room
            timeslot = new_timeslot

            conflict = (
                    (teacher, timeslot) in teacher_timeslot or
                    (room, timeslot) in room_timeslot or
                    (division, timeslot) in division_timeslot
            )

            attempts += 1

        gene.teacherId = teacher
        gene.roomId = room
        gene.timeslotId = timeslot

        teacher_timeslot.add((teacher, timeslot))
        room_timeslot.add((room, timeslot))
        division_timeslot.add((division, timeslot))

    return chromosome