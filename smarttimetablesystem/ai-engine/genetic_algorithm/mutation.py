import random


def mutate(chromosome, teachers, rooms, timeslots, mutation_rate=0.1):
    """
    Mutate a chromosome by randomly changing teacher, room, and timeslot.

    NOTE: The `timeslots` parameter passed here is ALREADY filtered to
    exclude break slots. Mutations will never place a gene into a break slot.
    """

    for gene in chromosome.genes:

        if random.random() < mutation_rate:

            gene.teacherId = random.choice(teachers)["id"]
            gene.roomId = random.choice(rooms)["id"]
            gene.timeslotId = random.choice(timeslots)["id"]