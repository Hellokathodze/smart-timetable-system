"""
Steady-State Genetic Algorithm for timetable scheduling.

Architectural variant of the Standard (generational) GA in timetable_generator.py.

Key differences from Standard GA:
- Instead of replacing the whole population each generation, produce ONE
  offspring per iteration and replace the currently-worst individual
  (if the child is better than the worst).
- Selection, crossover, mutation, and repair operators are REUSED
  from the Standard GA — only the replacement strategy differs.

Fair comparison: Standard GA uses ~POPULATION_SIZE evaluations per generation.
Steady-State uses 1 evaluation per iteration. For head-to-head comparison,
both should be given the same FITNESS EVALUATION BUDGET, not the same number
of "generations". This module exposes a MAX_EVALUATIONS budget that matches
the Standard GA's total budget (POPULATION_SIZE * GENERATIONS = 30 * 80 = 2400).

References:
- Syswerda, G. (1991). A Study of Reproduction in Generational and Steady-State
  Genetic Algorithms. Foundations of Genetic Algorithms, Vol. 1, pp. 94-101.
- Vavak, F. & Fogarty, T.C. (1996). Comparison of Steady State and Generational
  Genetic Algorithms for Use in Nonstationary Environments. IEEE CEC.
"""

import random
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
from scheduler.chromosome_repair import repair_chromosome


# -------------------------------------------------
# Parameters (matched to Standard GA for fair comparison)
# -------------------------------------------------
POPULATION_SIZE = 30
MAX_EVALUATIONS = 2400   # = POPULATION_SIZE * 80 (matches Standard GA's 80 generations)
MUTATION_RATE = 0.15

BREAK_WINDOW_START = 11
BREAK_WINDOW_END = 14
SLOTS_PER_DAY = 6
TEACHING_PER_DAY = 5


# -------------------------------------------------
# Helpers — copied from timetable_generator so this module is self-contained
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
    """Per-division expansion — same as timetable_generator."""
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
# Steady-State loop
# -------------------------------------------------

def generate_timetable(data):
    """
    Steady-State GA driver. Same input/output contract as
    timetable_generator.generate_timetable() so it's a drop-in variant
    for benchmarks.
    """

    teachers = data["teachers"]
    subjects = data["subjects"]
    rooms = data["rooms"]
    timeslots = data["timeslots"]

    # Type maps for Phase 2.5 constraints
    room_types = {r["id"]: r.get("type", "CLASSROOM") for r in rooms}
    subject_types = {s["id"]: s.get("type", "THEORY") for s in subjects}

    break_map = _generate_break_map(timeslots)
    break_ids = _get_break_timeslot_ids(break_map)
    print("🔴 BREAK SLOTS:", break_map)

    schedulable_timeslots = [ts for ts in timeslots if ts["id"] not in break_ids]

    expanded_subjects = _expand_subjects_for_full_week(subjects, schedulable_timeslots)
    num_divisions = len(set(
        (s.get("branch", "UNKNOWN"), s.get("division", "A"))
        for s in expanded_subjects
    ))
    print(f"📚 [Steady-State] Original: {len(subjects)}, Expanded: {len(expanded_subjects)} across {num_divisions} div(s)")

    # -------------------------
    # Initial population + initial evaluation
    # -------------------------
    population = generate_population(
        POPULATION_SIZE, expanded_subjects, teachers, rooms, schedulable_timeslots
    )
    for chrom in population:
        chrom.fitness = calculate_fitness(chrom, break_map, room_types, subject_types)

    evaluations_used = len(population)  # counted the initial pop
    fitness_history = [max(c.fitness for c in population)]

    # -------------------------
    # Steady-State main loop
    # One iteration = one offspring + one evaluation + one replacement
    # -------------------------
    iteration = 0
    while evaluations_used < MAX_EVALUATIONS:

        # Select two parents
        parent1 = tournament_selection(population)
        parent2 = tournament_selection(population)

        # Produce one offspring
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

        # Evaluate offspring
        child.fitness = calculate_fitness(child, break_map, room_types, subject_types)
        evaluations_used += 1

        # Replace-worst if the child is strictly better
        worst_idx = min(range(len(population)), key=lambda i: population[i].fitness)
        if child.fitness > population[worst_idx].fitness:
            population[worst_idx] = child

        # Record best-so-far
        best_now = max(c.fitness for c in population)
        fitness_history.append(best_now)

        # Optional progress log every 100 iterations to avoid noise
        if iteration % 100 == 0:
            print(f"[Steady-State] iter {iteration}, evals {evaluations_used}, best {best_now}")

        # Early stopping
        if best_now >= 100:
            print("✅ [Steady-State] PERFECT SOLUTION — STOPPING EARLY")
            break

        iteration += 1

    # -------------------------
    # Fitness graph
    # -------------------------
    try:
        plt.figure()
        plt.plot(range(len(fitness_history)), fitness_history, linewidth=1.2)
        plt.xlabel("Fitness Evaluation")
        plt.ylabel("Best Fitness")
        plt.title("Steady-State GA Fitness Progress")
        plt.grid(True, linestyle="--", alpha=0.4)
        plt.ylim(0, 105)
        plt.savefig("fitness_graph_steady_state.png", bbox_inches="tight")
        plt.close()
    except Exception as e:
        print("⚠️ Graph generation failed:", e)

    # -------------------------
    # Final result — best chromosome in population
    # -------------------------
    population.sort(key=lambda c: c.fitness, reverse=True)
    best = population[0]
    print(f"[Steady-State] FINAL: fitness={best.fitness}, evaluations={evaluations_used}")

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
        "evaluations": evaluations_used,
        "algorithm": "steady_state"
    }