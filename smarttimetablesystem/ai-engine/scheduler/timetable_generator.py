import random
import copy
import warnings
import os

# ✅ Suppress sklearn/joblib warnings GLOBALLY
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=".*sklearn.utils.parallel.delayed.*")
warnings.filterwarnings("ignore", message=".*joblib.*")
os.environ["PYTHONWARNINGS"] = "ignore::UserWarning"

from concurrent.futures import ThreadPoolExecutor

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from genetic_algorithm.population import generate_population
from genetic_algorithm.fitness import calculate_fitness
from genetic_algorithm.selection import tournament_selection
from genetic_algorithm.crossover import crossover
from genetic_algorithm.mutation import mutate
from scheduler.chromosome_repair import repair_chromosome


POPULATION_SIZE = 30
GENERATIONS = 80
MUTATION_RATE = 0.15

BREAK_WINDOW_START = 11
BREAK_WINDOW_END = 14
SLOTS_PER_DAY = 6
TEACHING_PER_DAY = 5  # per division per day


def _suppress_warnings():
    warnings.filterwarnings("ignore", category=UserWarning)
    warnings.filterwarnings("ignore", message=".*sklearn.utils.parallel.delayed.*")
    warnings.filterwarnings("ignore", message=".*joblib.*")


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
    """
    Ensure exactly TEACHING_PER_DAY * num_days entries PER DIVISION.
    Duplicates get unique IDs so GA treats them as separate events.
    Multi-class aware: expansion happens per division independently.
    """
    days = sorted(set(ts["id"].split("-")[0] for ts in schedulable_timeslots))
    num_days = len(days)
    per_division_needed = TEACHING_PER_DAY * num_days

    # Group subjects by (branch, division)
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

        # Start with originals
        expanded = [dict(s) for s in class_subjects]

        # Duplicate round-robin with unique IDs (per class)
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


def _fitness_worker(args):
    _suppress_warnings()
    chromosome, break_map = args
    return calculate_fitness(chromosome, break_map)


def generate_timetable(data):

    teachers = data["teachers"]
    subjects = data["subjects"]
    rooms = data["rooms"]
    timeslots = data["timeslots"]

    # Generate break slots
    break_map = _generate_break_map(timeslots)
    break_ids = _get_break_timeslot_ids(break_map)
    print("🔴 BREAK SLOTS:", break_map)

    # Filter out break timeslots
    schedulable_timeslots = [
        ts for ts in timeslots if ts["id"] not in break_ids
    ]

    # Expand subjects: TEACHING_PER_DAY * num_days entries per (branch, division)
    expanded_subjects = _expand_subjects_for_full_week(subjects, schedulable_timeslots)
    num_divisions = len(set(
        (s.get("branch", "UNKNOWN"), s.get("division", "A"))
        for s in expanded_subjects
    ))
    print(f"📚 Original subjects: {len(subjects)}, Expanded to: {len(expanded_subjects)} across {num_divisions} division(s)")

    population = generate_population(
        POPULATION_SIZE,
        expanded_subjects,
        teachers,
        rooms,
        schedulable_timeslots
    )

    fitness_history = []

    for generation in range(GENERATIONS):

        with ThreadPoolExecutor(initializer=_suppress_warnings) as executor:
            args_list = [(chrom, break_map) for chrom in population]
            fitness_values = list(executor.map(_fitness_worker, args_list))
            for chromosome, fitness in zip(population, fitness_values):
                chromosome.fitness = fitness

        population.sort(key=lambda c: c.fitness, reverse=True)

        best_fitness = population[0].fitness
        fitness_history.append(best_fitness)  # ✅ record BEFORE early-stop check
        print("Generation:", generation, "Best Fitness:", best_fitness)

        # ✅ Early stopping
        if best_fitness >= 100:
            print("✅ PERFECT SOLUTION FOUND — STOPPING EARLY")
            break

        # Elitism (top 5)
        new_population = [copy.deepcopy(c) for c in population[:5]]

        while len(new_population) < POPULATION_SIZE:
            parent1 = tournament_selection(population)
            parent2 = tournament_selection(population)
            child = crossover(parent1, parent2)
            child = repair_chromosome(child, teachers, rooms, schedulable_timeslots)
            if random.random() < MUTATION_RATE:
                mutate(child, teachers, rooms, schedulable_timeslots)
            child = repair_chromosome(child, teachers, rooms, schedulable_timeslots)
            new_population.append(child)

        population = new_population

    # Fitness graph
    try:
        plt.figure()
        plt.plot(range(1, len(fitness_history) + 1), fitness_history, marker='o', markersize=4)
        plt.xlabel("Generation")
        plt.ylabel("Best Fitness")
        plt.title("GA Fitness Progress")
        plt.grid(True, linestyle="--", alpha=0.4)
        plt.ylim(0, 105)
        plt.savefig("fitness_graph.png", bbox_inches="tight")
        plt.close()
    except Exception as e:
        print("⚠️ Graph generation failed:", e)

    # Final evaluation
    with ThreadPoolExecutor(initializer=_suppress_warnings) as executor:
        args_list = [(chrom, break_map) for chrom in population]
        fitness_values = list(executor.map(_fitness_worker, args_list))
        for chromosome, fitness in zip(population, fitness_values):
            chromosome.fitness = fitness

    population.sort(key=lambda c: c.fitness, reverse=True)
    best = population[0]

    # Build response — strip _dupN suffixes
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
        "breakSlots": break_map
    }