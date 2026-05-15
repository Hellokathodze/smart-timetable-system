class Chromosome:

    def __init__(self, genes):

        self.genes = genes
        self.fitness = 0

    def set_fitness(self, score):
        self.fitness = score

    def get_genes(self):
        return self.genes