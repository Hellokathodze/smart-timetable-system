import copy
import random
from models.chromosome import Chromosome


def crossover(parent1, parent2):
    """
    Single-point crossover producing one offspring per pair.

    Phase 5 fix: each gene is shallow-copied (copy.copy) to prevent
    shared references between the child and its parents. Without this,
    later mutation of the child silently corrupts the parent's genes,
    invalidating cached fitness values across the population.

    This bug was present since Phase 1 but only surfaced under memetic
    algorithms with many offspring per generation.
    """
    split = random.randint(0, len(parent1.genes) - 1)

    child_genes = (
        [copy.copy(g) for g in parent1.genes[:split]] +
        [copy.copy(g) for g in parent2.genes[split:]]
    )

    return Chromosome(child_genes)