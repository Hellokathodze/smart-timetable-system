import random


def mutate(chromosome, teachers, rooms, timeslots, mutation_rate=0.1,
           subject_types=None, room_types=None):
    """
    Mutate a chromosome by randomly changing teacher, room, and timeslot.

    Type-aware room selection (Phase 2.5):
    If subject_types and room_types are provided, LAB subjects will be assigned
    only to LAB rooms (falling back to any room if no LAB rooms exist).

    NOTE: The `timeslots` parameter passed here is ALREADY filtered to
    exclude break slots. Mutations will never place a gene into a break slot.
    """

    subject_types = subject_types or {}
    room_types = room_types or {}
    lab_rooms = [r for r in rooms if room_types.get(r["id"]) == "LAB"] or rooms
    classroom_rooms = [r for r in rooms if room_types.get(r["id"]) != "LAB"] or rooms

    for gene in chromosome.genes:

        if random.random() < mutation_rate:

            gene.teacherId = random.choice(teachers)["id"]

            # Type-aware room pick
            original_id = gene.subjectId.split("_dup")[0]
            subject_type = subject_types.get(original_id, "THEORY")
            if subject_type == "LAB":
                gene.roomId = random.choice(lab_rooms)["id"]
            else:
                gene.roomId = random.choice(classroom_rooms)["id"]

            gene.timeslotId = random.choice(timeslots)["id"]