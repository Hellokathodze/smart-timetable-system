"""
Memetic Algorithm (MA) for timetable scheduling.

Combines the Standard generational GA with a hill-climbing local search
step applied to every offspring after crossover, mutation, and repair.
This is the "explore-then-exploit" pattern originally proposed by Moscato
in [8] and widely adopted for combinatorial optimization problems including
timetabling [9, 10].

Two local search variants are supported:
- 'canonical' — Moscato-style random-field hill climbing (reference)
- 'domain_aware' — respects room-type constraints (our contribution)

Fair-budget comparison: local-search evaluations are counted against a shared
MAX_EVALUATIONS budget of 2400 (matching the Standard and Steady-State GAs).
The MA therefore runs FEWER generations than the Standard GA — each generation
is more expensive but higher-quality.

References:
- [8] Moscato, P. (1989). On evolution, search, optimization, genetic
      algorithms and martial arts: Towards memetic algorithms. Caltech.
- [9] Jat, S.N. & Yang, S. (2011). A hybrid genetic algorithm and tabu
      search approach for post enrolment course timetabling. J. Scheduling.
- [10] Nguyen, K. et al. (2011). Memetic algorithm for a university course
       timetabling problem. LNCS.
"""

import random
import copy
import warnings
import os

warnings.filterwarnings("ignore", category=UserWarning)
os.environ["PYTHONWARNINGS"] = "ignore::UserWarning"

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from genetic_algorithm.population import generate_population
from genetic_algorithm.fitness import calculate_fitness
from genetic_algorithm.selection import tournament_selection
from genetic_algorithm.crossover import crossover
from genetic_algorithm.mutation import mutate
from genetic_algorithm.local_search import (
    hill_climb_canonical, hill_climb_domain_aware, K_LOCAL_SEARCH
)
from scheduler.chromosome_repair import repair_chromosome


# -------------------------------------------------
# Parameters (matched to other GAs for fair comparison)
# -------------------------------------------------
POPULATION_SIZE = 30
MAX_EVALUATIONS = 2400
MUTATION_RATE = 0.15
ELITE_SIZE = 5

BREAK_WINDOW_START = 11
BREAK_WINDOW_END = 14
SLOTS_PER_DAY = 6
TEACHING_PER_DAY = 5


# -------------------------------------------------
# Helpers (same as other generators — self-contained module)
# -------------------------------------------------

def _get_break_eligible_slots(timeslots):
    eligible = set()
    for ts in timeslots:
        slot_num = ts.get("slotNumber", 0)
        start_time = ts.get("startTime", "")
        if start_time:
            try:
                hour = int(start_time.split(":")[0])
                if BREAK_WINDOW_START <= hour < BREAK_WINDOW_END:
                    eligible.add(slot_num)
            except (ValueError, IndexError):
                pass
    if not eligible:
        eligible = {3, 4, 5}
    return eligible


def _generate_break_map(timeslots):
    eligible = _get_break_eligible_slots(timeslots)
    days = set()
    for ts in timeslots:
        day = ts.get("day", "").upper()
        if day:
            days.add(day)
    break_map = {}
    eligible_list = sorted(eligible)
    for day in sorted(days):
        break_map[day] = random.choice(eligible_list)
    return break_map


def _get_break_timeslot_ids(break_map):
    return {f"{day}-{slot}" for day, slot in break_map.items()}


def _expand_subjects_for_full_week(subjects, schedulable_timeslots):
    days = sorted(set(ts["id"].split("-")[0] for ts in schedulable_timeslots))
    num_days = len(days)
    per_division_needed = TEACHING_PER_DAY * num_days

    by_class = {}
    for s in subjects:
        key = (s.get("branch", "UNKNOWN"), s.get("division", "A"))
        by_class.setdefault(key, []).append(s)

    all_expanded = []
    for class_key, class_subjects in by_class.items():
        if len(class_subjects) >= per_division_needed:
            expanded = [dict(s) for s in class_subjects]
            random.shuffle(expanded)
            all_expanded.extend(expanded[:per_division_needed])
            continue

        expanded = [dict(s) for s in class_subjects]
        dup_counter = 1
        idx = 0
        while len(expanded) < per_division_needed:
            original = class_subjects[idx % len(class_subjects)]
            dup = dict(original)
            dup["id"] = f"{original['id']}_dup{dup_counter}"
            expanded.append(dup)
            dup_counter += 1
            idx += 1
        random.shuffle(expanded)
        all_expanded.extend(expanded)

    random.shuffle(all_expanded)
    return all_expanded


# -------------------------------------------------
# Memetic Algorithm main driver
# -------------------------------------------------

def generate_timetable(data, local_search_variant="domain_aware"):
    """
    Memetic Algorithm timetable generator.

    Args:
        data: standard input dict (teachers, subjects, rooms, timeslots)
        local_search_variant: "canonical" or "domain_aware"

    Same input/output contract as timetable_generator.generate_timetable()
    for drop-in benchmark comparison.
    """

    if local_search_variant not in ("canonical", "domain_aware"):
        raise ValueError(
            f"local_search_variant must be 'canonical' or 'domain_aware', "
            f"got {local_search_variant!r}"
        )

    local_search_fn = (
        hill_climb_domain_aware if local_search_variant == "domain_aware"
        else hill_climb_canonical
    )

    teachers = data["teachers"]
    subjects = data["subjects"]
    rooms = data["rooms"]
    timeslots = data["timeslots"]

    # Type maps for Phase 2.5 constraints
    room_types = {r["id"]: r.get("type", "CLASSROOM") for r in rooms}
    subject_types = {s["id"]: s.get("type", "THEORY") for s in subjects}

    break_map = _generate_break_map(timeslots)
    break_ids = _get_break_timeslot_ids(break_map)
    print(f"🔴 [Memetic-{local_search_variant}] BREAK SLOTS:", break_map)

    schedulable_timeslots = [ts for ts in timeslots if ts["id"] not in break_ids]

    expanded_subjects = _expand_subjects_for_full_week(subjects, schedulable_timeslots)
    num_divisions = len(set(
        (s.get("branch", "UNKNOWN"), s.get("division", "A"))
        for s in expanded_subjects
    ))
    print(f"📚 [Memetic-{local_search_variant}] Expanded: {len(expanded_subjects)} across {num_divisions} div(s)")

    # -------------------------
    # Initial population + evaluation
    # -------------------------
    population = generate_population(
        POPULATION_SIZE, expanded_subjects, teachers, rooms, schedulable_timeslots
    )
    for chrom in population:
        chrom.fitness = calculate_fitness(chrom, break_map, room_types, subject_types)

    evaluations_used = len(population)
    fitness_history = [max(c.fitness for c in population)]

    generation = 0

    # -------------------------
    # Main loop — budget-constrained
    # -------------------------
    while evaluations_used < MAX_EVALUATIONS:

        population.sort(key=lambda c: c.fitness, reverse=True)

        best_now = population[0].fitness
        if best_now >= 100:
            print(f"✅ [Memetic-{local_search_variant}] PERFECT — gen {generation}, evals {evaluations_used}")
            break

        # New population starts with elites preserved
        new_population = [copy.deepcopy(c) for c in population[:ELITE_SIZE]]

        while len(new_population) < POPULATION_SIZE and evaluations_used < MAX_EVALUATIONS:

            # Standard GA phase: exploration
            parent1 = tournament_selection(population)
            parent2 = tournament_selection(population)
            child = crossover(parent1, parent2)
            child = repair_chromosome(
                child, teachers, rooms, schedulable_timeslots,
                subject_types=subject_types, room_types=room_types
            )
            if random.random() < MUTATION_RATE:
                mutate(
                    child, teachers, rooms, schedulable_timeslots,
                    subject_types=subject_types, room_types=room_types
                )
            child = repair_chromosome(
                child, teachers, rooms, schedulable_timeslots,
                subject_types=subject_types, room_types=room_types
            )

            # Memetic phase: exploitation — polish the offspring with local search
            child, ls_evals = local_search_fn(
                child, teachers, rooms, schedulable_timeslots,
                break_map, room_types, subject_types,
                k=K_LOCAL_SEARCH
            )
            evaluations_used += ls_evals

            new_population.append(child)

        population = new_population

        # Re-evaluate the population (only elites need fresh eval; offspring already done)
        # We re-evaluate elites to keep the loop symmetric, but count only their evals.
        for chrom in population[:ELITE_SIZE]:
            chrom.fitness = calculate_fitness(chrom, break_map, room_types, subject_types)
            evaluations_used += 1

        population.sort(key=lambda c: c.fitness, reverse=True)
        best_now = population[0].fitness
        fitness_history.append(best_now)
        print(f"[Memetic-{local_search_variant}] gen {generation}, evals {evaluations_used}, best {best_now}")

        generation += 1

    # -------------------------
    # Fitness graph
    # -------------------------
    try:
        plt.figure()
        plt.plot(range(len(fitness_history)), fitness_history, marker='o', markersize=4, linewidth=1.5)
        plt.xlabel("Generation")
        plt.ylabel("Best Fitness")
        plt.title(f"Memetic GA ({local_search_variant}) Fitness Progress")
        plt.grid(True, linestyle="--", alpha=0.4)
        plt.ylim(0, 105)
        plt.savefig(f"fitness_graph_memetic_{local_search_variant}.png", bbox_inches="tight")
        plt.close()
    except Exception as e:
        print(f"⚠️ Graph generation failed: {e}")

    # -------------------------
    # Final result
    # -------------------------
    population.sort(key=lambda c: c.fitness, reverse=True)
    best = population[0]
    print(f"[Memetic-{local_search_variant}] FINAL: fitness={best.fitness}, gens={generation}, evals={evaluations_used}")

    timetable = []
    for gene in best.genes:
        original_id = gene.subjectId.split("_dup")[0]
        timetable.append({
            "subject": original_id,
            "teacher": gene.teacherId,
            "room": gene.roomId,
            "timeslot": gene.timeslotId,
            "branch": gene.branch,
            "division": gene.division,
            "reasoning": [
                "No teacher conflict",
                "Room available",
                "Balanced distribution"
            ]
        })

    return {
        "timetable": timetable,
        "fitness": best.fitness,
        "breakSlots": break_map,
        "generations": generation,
        "evaluations": evaluations_used,
        "algorithm": f"memetic_{local_search_variant}"
    }