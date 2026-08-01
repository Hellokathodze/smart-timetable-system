"""
Local search operators for the Memetic Algorithm (Phase 4).

Implements two variants of hill-climbing local search on a chromosome:

1. `hill_climb_canonical` — the classical Moscato-style single-field random
   modification. Each attempt picks a random gene and a random field
   (teacher / room / timeslot), tries a random alternative from the full
   candidate pool, and keeps the change only if fitness improves. Serves as
   the reference implementation for reviewers and matches [8] Moscato (1989)
   and [9] Jat & Yang (2011).

2. `hill_climb_domain_aware` — a domain-informed variant that respects the
   room-type constraints established in Phase 2.5. When a room mutation is
   attempted, the candidate pool is restricted to compatible room types
   (LAB subjects → LAB rooms only; THEORY subjects → non-LAB rooms only).
   Teacher and timeslot moves are unchanged. This is our proposed
   contribution for empirical evaluation against the canonical form.

Both variants share:
- K attempts per invocation (default 10)
- Strictly-improving acceptance (child fitness must be > current fitness)
- Full fitness evaluation on every attempt — the caller is responsible for
  counting these against the shared evaluation budget

References:
- [8] Moscato, P. (1989). On evolution, search, optimization, genetic
      algorithms and martial arts: Towards memetic algorithms. Caltech
      Concurrent Computation Program Report 826.
- [9] Jat, S.N. & Yang, S. (2011). A hybrid genetic algorithm and tabu
      search approach for post enrolment course timetabling. Journal of
      Scheduling, 14(6), 617-637.
"""

import random
import copy

from genetic_algorithm.fitness import calculate_fitness


K_LOCAL_SEARCH = 10  # attempts per invocation (per Jat & Yang, 2011)


def _pick_random_field():
    """Pick which gene attribute to try mutating."""
    return random.choice(["teacher", "room", "timeslot"])


def _try_move(chromosome, gene_idx, field, new_value):
    """
    Apply a single field change to a gene. Returns the ORIGINAL value so
    the caller can revert if the change didn't improve fitness.
    """
    gene = chromosome.genes[gene_idx]
    if field == "teacher":
        old = gene.teacherId
        gene.teacherId = new_value
        return old
    elif field == "room":
        old = gene.roomId
        gene.roomId = new_value
        return old
    elif field == "timeslot":
        old = gene.timeslotId
        gene.timeslotId = new_value
        return old


def _revert(chromosome, gene_idx, field, old_value):
    """Restore a gene field to its previous value."""
    gene = chromosome.genes[gene_idx]
    if field == "teacher":
        gene.teacherId = old_value
    elif field == "room":
        gene.roomId = old_value
    elif field == "timeslot":
        gene.timeslotId = old_value


def hill_climb_canonical(chromosome, teachers, rooms, timeslots,
                         break_map, room_types, subject_types,
                         k=K_LOCAL_SEARCH):
    """
    Classical Moscato-style hill climbing: K random single-field moves,
    accept if fitness improves. No domain restrictions on room choices.

    Returns (chromosome, evaluations_used).
    Evaluation count includes the initial baseline + K attempts = K+1.
    """
    current_fitness = calculate_fitness(chromosome, break_map, room_types, subject_types)
    chromosome.fitness = current_fitness
    evals = 1

    for _ in range(k):
        if not chromosome.genes:
            break
        gene_idx = random.randint(0, len(chromosome.genes) - 1)
        field = _pick_random_field()

        # Unrestricted candidate pools (canonical: no domain knowledge)
        if field == "teacher":
            new_value = random.choice(teachers)["id"]
        elif field == "room":
            new_value = random.choice(rooms)["id"]
        else:
            new_value = random.choice(timeslots)["id"]

        old_value = _try_move(chromosome, gene_idx, field, new_value)
        new_fitness = calculate_fitness(chromosome, break_map, room_types, subject_types)
        evals += 1

        if new_fitness > current_fitness:
            current_fitness = new_fitness
            chromosome.fitness = new_fitness
        else:
            _revert(chromosome, gene_idx, field, old_value)

    return chromosome, evals


def hill_climb_domain_aware(chromosome, teachers, rooms, timeslots,
                            break_map, room_types, subject_types,
                            k=K_LOCAL_SEARCH):
    """
    Domain-aware hill climbing variant: same as canonical, except room
    changes respect subject/room type compatibility (Phase 2.5 constraint).

    LAB subjects → picks only from LAB rooms
    THEORY subjects → picks only from non-LAB rooms
    Teacher / timeslot changes are unchanged from canonical.

    This is our proposed contribution — a local-search operator that leverages
    the room-type structure of academic timetabling. Reduces waste on
    room-change attempts that would immediately be penalized by the fitness
    function.

    Returns (chromosome, evaluations_used).
    """
    lab_rooms = [r for r in rooms if room_types.get(r["id"]) == "LAB"] or rooms
    theory_rooms = [r for r in rooms if room_types.get(r["id"]) != "LAB"] or rooms

    current_fitness = calculate_fitness(chromosome, break_map, room_types, subject_types)
    chromosome.fitness = current_fitness
    evals = 1

    for _ in range(k):
        if not chromosome.genes:
            break
        gene_idx = random.randint(0, len(chromosome.genes) - 1)
        gene = chromosome.genes[gene_idx]
        field = _pick_random_field()

        if field == "teacher":
            new_value = random.choice(teachers)["id"]
        elif field == "room":
            # Domain-aware: restrict pool by subject type
            original_id = gene.subjectId.split("_dup")[0]
            subj_type = subject_types.get(original_id, "THEORY")
            pool = lab_rooms if subj_type == "LAB" else theory_rooms
            new_value = random.choice(pool)["id"]
        else:
            new_value = random.choice(timeslots)["id"]

        old_value = _try_move(chromosome, gene_idx, field, new_value)
        new_fitness = calculate_fitness(chromosome, break_map, room_types, subject_types)
        evals += 1

        if new_fitness > current_fitness:
            current_fitness = new_fitness
            chromosome.fitness = new_fitness
        else:
            _revert(chromosome, gene_idx, field, old_value)

    return chromosome, evals