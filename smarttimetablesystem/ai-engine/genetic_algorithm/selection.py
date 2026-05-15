import random


def tournament_selection(population, k=3):

    selected = random.sample(population, k)

    selected.sort(key=lambda x: x.fitness, reverse=True)

    return selected[0]