"""
Phase 5 — Full benchmark harness.

Runs 4 algorithms x 3 instance sizes x 30 seeds = 360 runs.

Reports ITC-2007 convention: Distance to Feasibility (hard constraint
violations) primary, soft constraint violations secondary. See:
https://www.eeecs.qub.ac.uk/itc2007/

Usage (from ai-engine/ folder with venv active):
    python -m experiments.run_benchmark
"""

import os
import sys
import time
import csv
import random
import warnings
import copy
from collections import defaultdict

warnings.filterwarnings("ignore")

_HERE = os.path.dirname(os.path.abspath(__file__))
_AI_ENGINE = os.path.dirname(_HERE)
if _AI_ENGINE not in sys.path:
    sys.path.insert(0, _AI_ENGINE)

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from experiments.benchmark_utils import (
    INSTANCES, build_instance, count_violations
)


N_SEEDS = 30
SEEDS = list(range(N_SEEDS))
INSTANCE_SIZES = ["Small", "Medium", "Large"]

ALGORITHMS = [
    "standard",
    "steady_state",
    "memetic_canonical",
    "memetic_domain_aware",
]

ALGO_LABELS = {
    "standard": "Standard GA",
    "steady_state": "Steady-State GA",
    "memetic_canonical": "Memetic (canonical)",
    "memetic_domain_aware": "Memetic (domain-aware)",
}

ALGO_COLORS = {
    "standard": "#1f77b4",
    "steady_state": "#ff7f0e",
    "memetic_canonical": "#2ca02c",
    "memetic_domain_aware": "#d62728",
}


def _run_standard(data, seed):
    from genetic_algorithm.population import generate_population
    from genetic_algorithm.fitness import calculate_fitness
    from genetic_algorithm.selection import tournament_selection
    from genetic_algorithm.crossover import crossover
    from genetic_algorithm.mutation import mutate
    from scheduler.chromosome_repair import repair_chromosome
    from scheduler.timetable_generator import (
        _generate_break_map, _get_break_timeslot_ids, _expand_subjects_for_full_week,
        POPULATION_SIZE, GENERATIONS, MUTATION_RATE,
    )

    random.seed(seed)
    teachers = data["teachers"]; subjects = data["subjects"]
    rooms = data["rooms"]; timeslots = data["timeslots"]
    room_types = {r["id"]: r.get("type", "CLASSROOM") for r in rooms}
    subject_types = {s["id"]: s.get("type", "THEORY") for s in subjects}

    break_map = _generate_break_map(timeslots)
    break_ids = _get_break_timeslot_ids(break_map)
    sched = [ts for ts in timeslots if ts["id"] not in break_ids]
    expanded = _expand_subjects_for_full_week(subjects, sched)

    pop = generate_population(POPULATION_SIZE, expanded, teachers, rooms, sched)
    evaluations = 0
    fitness_history = []

    for gen in range(GENERATIONS):
        for c in pop:
            c.fitness = calculate_fitness(c, break_map, room_types, subject_types)
        evaluations += len(pop)
        pop.sort(key=lambda c: c.fitness, reverse=True)
        fitness_history.append(pop[0].fitness)

        if pop[0].fitness >= 100:
            break

        new_pop = [copy.deepcopy(c) for c in pop[:5]]
        while len(new_pop) < POPULATION_SIZE:
            p1 = tournament_selection(pop); p2 = tournament_selection(pop)
            child = crossover(p1, p2)
            child = repair_chromosome(
                child, teachers, rooms, sched,
                subject_types=subject_types, room_types=room_types,
            )
            if random.random() < MUTATION_RATE:
                mutate(
                    child, teachers, rooms, sched,
                    subject_types=subject_types, room_types=room_types,
                )
            child = repair_chromosome(
                child, teachers, rooms, sched,
                subject_types=subject_types, room_types=room_types,
            )
            new_pop.append(child)
        pop = new_pop

    # Phase 5 fix: final evaluation of last-generation offspring
    for c in pop:
        c.fitness = calculate_fitness(c, break_map, room_types, subject_types)
    evaluations += len(pop)
    pop.sort(key=lambda c: c.fitness, reverse=True)
    best = pop[0]

    timetable = [{
        "subject": g.subjectId.split("_dup")[0],
        "teacher": g.teacherId, "room": g.roomId,
        "timeslot": g.timeslotId,
        "branch": g.branch, "division": g.division,
    } for g in best.genes]

    return {
        "fitness": best.fitness,
        "evaluations": evaluations,
        "generations": len(fitness_history),
        "fitness_history": fitness_history,
        "eval_history": [(i + 1) * POPULATION_SIZE for i in range(len(fitness_history))],
        "timetable": timetable,
        "break_map": break_map,
    }


def _run_steady_state(data, seed):
    from genetic_algorithm.population import generate_population
    from genetic_algorithm.fitness import calculate_fitness
    from genetic_algorithm.selection import tournament_selection
    from genetic_algorithm.crossover import crossover
    from genetic_algorithm.mutation import mutate
    from scheduler.chromosome_repair import repair_chromosome
    from scheduler.steady_state_generator import (
        _generate_break_map, _get_break_timeslot_ids, _expand_subjects_for_full_week,
        POPULATION_SIZE, MAX_EVALUATIONS, MUTATION_RATE,
    )

    random.seed(seed)
    teachers = data["teachers"]; subjects = data["subjects"]
    rooms = data["rooms"]; timeslots = data["timeslots"]
    room_types = {r["id"]: r.get("type", "CLASSROOM") for r in rooms}
    subject_types = {s["id"]: s.get("type", "THEORY") for s in subjects}

    break_map = _generate_break_map(timeslots)
    break_ids = _get_break_timeslot_ids(break_map)
    sched = [ts for ts in timeslots if ts["id"] not in break_ids]
    expanded = _expand_subjects_for_full_week(subjects, sched)

    pop = generate_population(POPULATION_SIZE, expanded, teachers, rooms, sched)
    for c in pop:
        c.fitness = calculate_fitness(c, break_map, room_types, subject_types)
    evaluations = len(pop)
    fitness_history = [max(c.fitness for c in pop)]
    eval_history = [evaluations]

    while evaluations < MAX_EVALUATIONS:
        p1 = tournament_selection(pop); p2 = tournament_selection(pop)
        child = crossover(p1, p2)
        child = repair_chromosome(
            child, teachers, rooms, sched,
            subject_types=subject_types, room_types=room_types,
        )
        if random.random() < MUTATION_RATE:
            mutate(
                child, teachers, rooms, sched,
                subject_types=subject_types, room_types=room_types,
            )
        child = repair_chromosome(
            child, teachers, rooms, sched,
            subject_types=subject_types, room_types=room_types,
        )
        child.fitness = calculate_fitness(child, break_map, room_types, subject_types)
        evaluations += 1

        worst_idx = min(range(len(pop)), key=lambda i: pop[i].fitness)
        if child.fitness > pop[worst_idx].fitness:
            pop[worst_idx] = child

        best = max(c.fitness for c in pop)
        fitness_history.append(best)
        eval_history.append(evaluations)
        if best >= 100:
            break

    pop.sort(key=lambda c: c.fitness, reverse=True)
    best = pop[0]

    timetable = [{
        "subject": g.subjectId.split("_dup")[0],
        "teacher": g.teacherId, "room": g.roomId,
        "timeslot": g.timeslotId,
        "branch": g.branch, "division": g.division,
    } for g in best.genes]

    return {
        "fitness": best.fitness,
        "evaluations": evaluations,
        "generations": None,
        "fitness_history": fitness_history,
        "eval_history": eval_history,
        "timetable": timetable,
        "break_map": break_map,
    }


def _run_memetic(data, seed, variant):
    from genetic_algorithm.population import generate_population
    from genetic_algorithm.fitness import calculate_fitness
    from genetic_algorithm.selection import tournament_selection
    from genetic_algorithm.crossover import crossover
    from genetic_algorithm.mutation import mutate
    from genetic_algorithm.local_search import (
        hill_climb_canonical, hill_climb_domain_aware, K_LOCAL_SEARCH,
    )
    from scheduler.chromosome_repair import repair_chromosome
    from scheduler.memetic_generator import (
        _generate_break_map, _get_break_timeslot_ids, _expand_subjects_for_full_week,
        POPULATION_SIZE, MAX_EVALUATIONS, MUTATION_RATE, ELITE_SIZE,
    )

    ls_fn = hill_climb_domain_aware if variant == "domain_aware" else hill_climb_canonical

    random.seed(seed)
    teachers = data["teachers"]; subjects = data["subjects"]
    rooms = data["rooms"]; timeslots = data["timeslots"]
    room_types = {r["id"]: r.get("type", "CLASSROOM") for r in rooms}
    subject_types = {s["id"]: s.get("type", "THEORY") for s in subjects}

    break_map = _generate_break_map(timeslots)
    break_ids = _get_break_timeslot_ids(break_map)
    sched = [ts for ts in timeslots if ts["id"] not in break_ids]
    expanded = _expand_subjects_for_full_week(subjects, sched)

    pop = generate_population(POPULATION_SIZE, expanded, teachers, rooms, sched)
    for c in pop:
        c.fitness = calculate_fitness(c, break_map, room_types, subject_types)
    evaluations = len(pop)
    fitness_history = [max(c.fitness for c in pop)]
    eval_history = [evaluations]
    generation = 0

    while evaluations < MAX_EVALUATIONS:
        pop.sort(key=lambda c: c.fitness, reverse=True)
        if pop[0].fitness >= 100:
            break

        new_pop = [copy.deepcopy(c) for c in pop[:ELITE_SIZE]]
        while len(new_pop) < POPULATION_SIZE and evaluations < MAX_EVALUATIONS:
            p1 = tournament_selection(pop); p2 = tournament_selection(pop)
            child = crossover(p1, p2)
            child = repair_chromosome(
                child, teachers, rooms, sched,
                subject_types=subject_types, room_types=room_types,
            )
            if random.random() < MUTATION_RATE:
                mutate(
                    child, teachers, rooms, sched,
                    subject_types=subject_types, room_types=room_types,
                )
            child = repair_chromosome(
                child, teachers, rooms, sched,
                subject_types=subject_types, room_types=room_types,
            )
            child, ls_evals = ls_fn(
                child, teachers, rooms, sched,
                break_map, room_types, subject_types, k=K_LOCAL_SEARCH,
            )
            evaluations += ls_evals
            new_pop.append(child)

        pop = new_pop
        for c in pop[:ELITE_SIZE]:
            c.fitness = calculate_fitness(c, break_map, room_types, subject_types)
            evaluations += 1
        pop.sort(key=lambda c: c.fitness, reverse=True)
        fitness_history.append(pop[0].fitness)
        eval_history.append(evaluations)
        generation += 1

    pop.sort(key=lambda c: c.fitness, reverse=True)
    best = pop[0]

    timetable = [{
        "subject": g.subjectId.split("_dup")[0],
        "teacher": g.teacherId, "room": g.roomId,
        "timeslot": g.timeslotId,
        "branch": g.branch, "division": g.division,
    } for g in best.genes]

    return {
        "fitness": best.fitness,
        "evaluations": evaluations,
        "generations": generation,
        "fitness_history": fitness_history,
        "eval_history": eval_history,
        "timetable": timetable,
        "break_map": break_map,
    }


ALGORITHM_RUNNERS = {
    "standard": lambda data, seed: _run_standard(data, seed),
    "steady_state": lambda data, seed: _run_steady_state(data, seed),
    "memetic_canonical": lambda data, seed: _run_memetic(data, seed, "canonical"),
    "memetic_domain_aware": lambda data, seed: _run_memetic(data, seed, "domain_aware"),
}


def run_all():
    print(f"Phase 5 benchmark: {len(ALGORITHMS)} algos x {len(INSTANCE_SIZES)} sizes x {N_SEEDS} seeds")
    print(f"Total runs: {len(ALGORITHMS) * len(INSTANCE_SIZES) * N_SEEDS}")
    raw_rows = []
    histories = defaultdict(lambda: defaultdict(list))
    total = len(ALGORITHMS) * len(INSTANCE_SIZES) * N_SEEDS
    done = 0
    t_start = time.perf_counter()

    for size in INSTANCE_SIZES:
        for seed in SEEDS:
            data = build_instance(size, seed)
            subject_types = {s["id"]: s.get("type", "THEORY") for s in data["subjects"]}
            room_types = {r["id"]: r.get("type", "CLASSROOM") for r in data["rooms"]}

            for algo in ALGORITHMS:
                t0 = time.perf_counter()
                result = ALGORITHM_RUNNERS[algo](data, seed)
                runtime = time.perf_counter() - t0

                viol = count_violations(
                    result["timetable"], subject_types, room_types, result["break_map"]
                )

                raw_rows.append({
                    "algorithm": algo,
                    "size": size,
                    "seed": seed,
                    "distance_to_feasibility": viol["hard_total"],
                    "soft_violations": viol["soft_total"],
                    "is_valid": 1 if viol["hard_total"] == 0 else 0,
                    "is_perfect": 1 if (viol["hard_total"] == 0 and viol["soft_total"] == 0) else 0,
                    "evaluations": result["evaluations"],
                    "runtime_s": round(runtime, 4),
                    "raw_fitness": result["fitness"],
                    "history_length": len(result["fitness_history"]),
                })

                histories[algo][size].append(
                    (result["eval_history"], result["fitness_history"])
                )

                done += 1
                if done % 30 == 0 or done == total:
                    elapsed = time.perf_counter() - t_start
                    print(f"  [{done}/{total}] {size} seed={seed} {algo:22s} "
                          f"DF={viol['hard_total']:3d} soft={viol['soft_total']:3d} "
                          f"evals={result['evaluations']:5d} rt={runtime:.2f}s elapsed={elapsed:.0f}s")

    elapsed = time.perf_counter() - t_start
    print(f"\nAll runs complete in {elapsed:.1f}s ({elapsed/60:.1f} min)")
    return raw_rows, histories


def _mean_std(vals):
    n = len(vals)
    if n == 0:
        return 0.0, 0.0
    m = sum(vals) / n
    if n < 2:
        return m, 0.0
    var = sum((v - m) ** 2 for v in vals) / (n - 1)
    return m, var ** 0.5


def write_summary(raw_rows, results_dir):
    grouped = defaultdict(list)
    for r in raw_rows:
        grouped[(r["algorithm"], r["size"])].append(r)

    path = os.path.join(results_dir, "summary_table.csv")
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow([
            "algorithm", "size", "n",
            "distance_to_feasibility_mean", "distance_to_feasibility_std",
            "soft_violations_mean", "soft_violations_std",
            "valid_solutions_pct", "perfect_solutions_pct",
            "evaluations_mean", "evaluations_std",
            "runtime_mean_s", "runtime_std_s",
        ])
        for (algo, size), rows in sorted(grouped.items()):
            df_m, df_s = _mean_std([r["distance_to_feasibility"] for r in rows])
            sv_m, sv_s = _mean_std([r["soft_violations"] for r in rows])
            valid_pct = 100.0 * sum(r["is_valid"] for r in rows) / len(rows)
            perfect_pct = 100.0 * sum(r["is_perfect"] for r in rows) / len(rows)
            ev_m, ev_s = _mean_std([r["evaluations"] for r in rows])
            rt_m, rt_s = _mean_std([r["runtime_s"] for r in rows])
            w.writerow([
                algo, size, len(rows),
                round(df_m, 2), round(df_s, 2),
                round(sv_m, 2), round(sv_s, 2),
                round(valid_pct, 1), round(perfect_pct, 1),
                round(ev_m, 1), round(ev_s, 1),
                round(rt_m, 3), round(rt_s, 3),
            ])
    print(f"Wrote: {path}")


def _welch_t_test(x, y):
    import math
    n1, n2 = len(x), len(y)
    if n1 < 2 or n2 < 2:
        return 0.0, 1.0
    m1, s1 = _mean_std(x)
    m2, s2 = _mean_std(y)
    v1, v2 = s1 ** 2, s2 ** 2
    if v1 == 0 and v2 == 0:
        return 0.0, 1.0
    se = math.sqrt(v1 / n1 + v2 / n2)
    if se == 0:
        return 0.0, 1.0
    t = (m1 - m2) / se
    z = abs(t)
    p = math.erfc(z / math.sqrt(2))
    return t, p


def write_significance(raw_rows, results_dir):
    """Pairwise Welch's t-test on distance_to_feasibility (lower is better)."""
    grouped = defaultdict(list)
    for r in raw_rows:
        grouped[(r["algorithm"], r["size"])].append(r["distance_to_feasibility"])

    path = os.path.join(results_dir, "significance.csv")
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow([
            "size", "algo_a", "algo_b",
            "DF_mean_a", "DF_mean_b",
            "t_stat", "p_value", "sig_at_p_0.05",
        ])
        for size in INSTANCE_SIZES:
            for i, a in enumerate(ALGORITHMS):
                for b in ALGORITHMS[i + 1:]:
                    xs = grouped.get((a, size), [])
                    ys = grouped.get((b, size), [])
                    if not xs or not ys:
                        continue
                    m_a, _ = _mean_std(xs)
                    m_b, _ = _mean_std(ys)
                    t, p = _welch_t_test(xs, ys)
                    w.writerow([
                        size, a, b,
                        round(m_a, 2), round(m_b, 2),
                        round(t, 3), round(p, 4),
                        "YES" if p < 0.05 else "no",
                    ])
    print(f"Wrote: {path}")


def write_raw(raw_rows, results_dir):
    path = os.path.join(results_dir, "raw_runs.csv")
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(raw_rows[0].keys()))
        w.writeheader()
        w.writerows(raw_rows)
    print(f"Wrote: {path}")


def _interpolate_to_grid(eh, fh, grid):
    grid = np.asarray(grid)
    if not eh or not fh:
        return np.full_like(grid, np.nan, dtype=float)
    evals = np.asarray(eh, dtype=float)
    fits = np.asarray(fh, dtype=float)
    out = np.full_like(grid, np.nan, dtype=float)
    idx = 0
    last_fit = fits[0]
    for i, g in enumerate(grid):
        while idx < len(evals) and evals[idx] <= g:
            last_fit = fits[idx]
            idx += 1
        out[i] = last_fit if g >= evals[0] else np.nan
    return out


def plot_convergence_by_evals(histories, figures_dir, size="Medium"):
    grid = np.linspace(30, 10000, 100)
    fig, ax = plt.subplots(figsize=(7, 4.5), dpi=150)

    for algo in ALGORITHMS:
        curves = histories[algo][size]
        if not curves:
            continue
        interp = np.stack([_interpolate_to_grid(eh, fh, grid) for eh, fh in curves])
        mean = np.nanmean(interp, axis=0)
        std = np.nanstd(interp, axis=0)
        ax.plot(grid, mean, color=ALGO_COLORS[algo],
                label=ALGO_LABELS[algo], linewidth=2)
        ax.fill_between(grid, mean - std, mean + std,
                        color=ALGO_COLORS[algo], alpha=0.15)

    ax.set_xlabel("Fitness Evaluations")
    ax.set_ylabel("Fitness (100 - penalty)")
    ax.set_title(f"Convergence Comparison ({size} instance, mean of {N_SEEDS} seeds)")
    ax.grid(True, linestyle="--", alpha=0.4)
    ax.legend(loc="lower right", framealpha=0.9)
    fig.tight_layout()
    path = os.path.join(figures_dir, "convergence_by_evals.png")
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote: {path}")


def plot_convergence_by_gens(histories, figures_dir, size="Medium"):
    fig, ax = plt.subplots(figsize=(7, 4.5), dpi=150)

    for algo in ALGORITHMS:
        curves = histories[algo][size]
        if not curves:
            continue
        max_len = max(len(fh) for _, fh in curves)
        padded = np.stack([
            np.pad(np.asarray(fh, float), (0, max_len - len(fh)), constant_values=fh[-1])
            for _, fh in curves
        ])
        gens = np.arange(1, max_len + 1)
        mean = padded.mean(axis=0)
        std = padded.std(axis=0)
        ax.plot(gens, mean, color=ALGO_COLORS[algo],
                label=ALGO_LABELS[algo], linewidth=2)
        ax.fill_between(gens, mean - std, mean + std,
                        color=ALGO_COLORS[algo], alpha=0.15)

    ax.set_xlabel("Generation / Iteration")
    ax.set_ylabel("Fitness (100 - penalty)")
    ax.set_title(f"Convergence by Generation ({size} instance, mean of {N_SEEDS} seeds)")
    ax.grid(True, linestyle="--", alpha=0.4)
    ax.legend(loc="lower right", framealpha=0.9)
    fig.tight_layout()
    path = os.path.join(figures_dir, "convergence_by_gens.png")
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote: {path}")


def plot_scalability(raw_rows, figures_dir):
    grouped = defaultdict(list)
    for r in raw_rows:
        grouped[(r["algorithm"], r["size"])].append(r["distance_to_feasibility"])

    fig, ax = plt.subplots(figsize=(7, 4.5), dpi=150)
    x_positions = {"Small": 0, "Medium": 1, "Large": 2}

    for algo in ALGORITHMS:
        means = []; stds = []; xs = []
        for size in INSTANCE_SIZES:
            values = grouped.get((algo, size), [])
            if not values:
                continue
            m, s = _mean_std(values)
            means.append(m); stds.append(s); xs.append(x_positions[size])
        ax.errorbar(xs, means, yerr=stds, marker="o",
                    label=ALGO_LABELS[algo],
                    color=ALGO_COLORS[algo], linewidth=2, capsize=4)

    ax.set_xticks(list(x_positions.values()))
    ax.set_xticklabels(list(x_positions.keys()))
    ax.set_xlabel("Instance Size")
    ax.set_ylabel("Distance to Feasibility (hard violations)")
    ax.set_title(f"Scalability Across Instance Sizes (mean of {N_SEEDS} seeds)")
    ax.grid(True, linestyle="--", alpha=0.4)
    ax.legend(loc="upper left", framealpha=0.9)
    fig.tight_layout()
    path = os.path.join(figures_dir, "scalability.png")
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote: {path}")


def main():
    results_dir = os.path.join(_HERE, "results")
    figures_dir = os.path.join(_HERE, "figures")
    os.makedirs(results_dir, exist_ok=True)
    os.makedirs(figures_dir, exist_ok=True)

    raw_rows, histories = run_all()

    print("\nWriting outputs...")
    write_raw(raw_rows, results_dir)
    write_summary(raw_rows, results_dir)
    write_significance(raw_rows, results_dir)

    plot_convergence_by_evals(histories, figures_dir, size="Medium")
    plot_convergence_by_gens(histories, figures_dir, size="Medium")
    plot_scalability(raw_rows, figures_dir)

    print("\nDone. Outputs in:")
    print(f"  {results_dir}")
    print(f"  {figures_dir}")


if __name__ == "__main__":
    main()