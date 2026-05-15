import random
from models.chromosome import Chromosome


def crossover(parent1, parent2):

    split = random.randint(0, len(parent1.genes) - 1)

    child_genes = parent1.genes[:split] + parent2.genes[split:]

    child = Chromosome(child_genes)

    return child
