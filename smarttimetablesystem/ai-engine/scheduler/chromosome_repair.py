import random


def repair_chromosome(chromosome, teachers, rooms, timeslots):
    """
    Repair a chromosome by resolving conflicts (teacher/room/division collisions).

    NOTE: The `timeslots` parameter passed here is ALREADY filtered to
    exclude break slots. Repairs will never place a gene into a break slot.
    """

    teacher_timeslot = set()
    room_timeslot = set()
    division_timeslot = set()

    for gene in chromosome.genes:

        teacher = gene.teacherId
        room = gene.roomId
        timeslot = gene.timeslotId
        division = gene.division

        conflict = (
                (teacher, timeslot) in teacher_timeslot or
                (room, timeslot) in room_timeslot or
                (division, timeslot) in division_timeslot
        )

        attempts = 0

        while conflict and attempts < 20:

            new_teacher = random.choice(teachers)["id"]
            new_room = random.choice(rooms)["id"]
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