"""
Supplement to run_benchmark.py that captures fitness histories to disk.

Runs the same 4 algorithms x 30 seeds on the Medium instance only,
persists per-run fitness histories to a pickle file, then generates
publication-quality convergence figures.

Why this exists: the main run_benchmark.py doesn't save histories,
so we can't restyle convergence plots without re-running the whole
360-run benchmark. This script does Medium-only (~15 min) and saves
histories so future plot iterations are instant.

Usage (from ai-engine/ folder with venv active):
    python -m experiments.replot_medium
"""

import os
import sys
import time
import pickle
import random
import warnings
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

from experiments.benchmark_utils import build_instance
from experiments.run_benchmark import (
    ALGORITHM_RUNNERS, ALGO_LABELS, ALGO_COLORS, ALGORITHMS,
)


N_SEEDS = 30
SIZE = "Medium"


def collect_histories():
    """Run all 4 algorithms x N_SEEDS on Medium, capture histories."""
    print(f"Collecting histories: {len(ALGORITHMS)} algos x {N_SEEDS} seeds on {SIZE}")
    print(f"Total runs: {len(ALGORITHMS) * N_SEEDS}")
    print()

    histories = defaultdict(list)
    total = len(ALGORITHMS) * N_SEEDS
    done = 0
    t_start = time.perf_counter()

    for seed in range(N_SEEDS):
        data = build_instance(SIZE, seed)
        for algo in ALGORITHMS:
            t0 = time.perf_counter()
            result = ALGORITHM_RUNNERS[algo](data, seed)
            runtime = time.perf_counter() - t0
            histories[algo].append({
                "seed": seed,
                "eval_history": result["eval_history"],
                "fitness_history": result["fitness_history"],
                "final_fitness": result["fitness"],
                "evaluations": result["evaluations"],
                "runtime_s": runtime,
            })
            done += 1
            if done % 8 == 0 or done == total:
                elapsed = time.perf_counter() - t_start
                print(f"  [{done}/{total}] seed={seed} {algo:22s} "
                      f"fitness={result['fitness']:6.0f} evals={result['evaluations']:5d} "
                      f"rt={runtime:5.2f}s elapsed={elapsed:.0f}s")

    elapsed = time.perf_counter() - t_start
    print(f"\nDone in {elapsed:.1f}s ({elapsed/60:.1f} min)")
    return dict(histories)


def save_histories(histories, path):
    with open(path, "wb") as f:
        pickle.dump(histories, f)
    print(f"Saved histories to: {path}")


def _interpolate_to_grid(eh, fh, grid):
    grid = np.asarray(grid)
    if not eh or not fh:
        return np.full_like(grid, np.nan, dtype=float)
    evals = np.asarray(eh, dtype=float)
    fits = np.asarray(fh, dtype=float)
    out = np.full_like(grid, np.nan, dtype=float)
    idx = 0
    last = fits[0]
    for i, g in enumerate(grid):
        while idx < len(evals) and evals[idx] <= g:
            last = fits[idx]
            idx += 1
        out[i] = last if g >= evals[0] else np.nan
    return out


def plot_convergence_by_evals(histories, figures_dir):
    """Clean convergence plot: penalty scale, zoomed, faint bands."""
    grid = np.linspace(30, 10000, 120)
    fig, ax = plt.subplots(figsize=(7, 4.5), dpi=200)

    for algo in ALGORITHMS:
        runs = histories.get(algo, [])
        if not runs:
            continue
        interp = np.stack([
            _interpolate_to_grid(r["eval_history"], r["fitness_history"], grid)
            for r in runs
        ])
        # Convert fitness -> penalty (100 - fitness), so lower is better
        penalty = 100 - interp
        mean = np.nanmean(penalty, axis=0)
        std = np.nanstd(penalty, axis=0)

        ax.plot(grid, mean, color=ALGO_COLORS[algo],
                label=ALGO_LABELS[algo], linewidth=2.5)
        ax.fill_between(grid, mean - std, mean + std,
                        color=ALGO_COLORS[algo], alpha=0.08, linewidth=0)

    ax.set_xlabel("Fitness Evaluations")
    ax.set_ylabel("Total Penalty (lower is better)")
    ax.set_ylim(395, 560)  # zoomed to interesting range
    ax.set_xlim(0, 10000)
    ax.set_title(f"Convergence Comparison ({SIZE} instance, mean of {N_SEEDS} seeds)")
    ax.grid(True, linestyle="--", alpha=0.4)
    ax.legend(loc="upper right", framealpha=0.95)
    fig.tight_layout()

    path = os.path.join(figures_dir, "convergence_by_evals_clean.png")
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote: {path}")


def plot_convergence_by_gens(histories, figures_dir):
    """Clean generation-view plot: penalty scale, faint bands. Note: unfair
    x-axis because each algorithm does different work per generation; use
    convergence_by_evals for fair comparison."""
    fig, ax = plt.subplots(figsize=(7, 4.5), dpi=200)

    for algo in ALGORITHMS:
        runs = histories.get(algo, [])
        if not runs:
            continue
        max_len = max(len(r["fitness_history"]) for r in runs)
        padded = np.stack([
            np.pad(np.asarray(r["fitness_history"], float),
                   (0, max_len - len(r["fitness_history"])),
                   constant_values=r["fitness_history"][-1])
            for r in runs
        ])
        # Convert fitness -> penalty
        penalty = 100 - padded
        gens = np.arange(1, max_len + 1)
        mean = penalty.mean(axis=0)
        std = penalty.std(axis=0)

        ax.plot(gens, mean, color=ALGO_COLORS[algo],
                label=ALGO_LABELS[algo], linewidth=2.5)
        ax.fill_between(gens, mean - std, mean + std,
                        color=ALGO_COLORS[algo], alpha=0.08, linewidth=0)

    ax.set_xlabel("Generation / Iteration")
    ax.set_ylabel("Total Penalty (lower is better)")
    ax.set_ylim(395, 560)
    ax.set_title(f"Convergence by Generation ({SIZE} instance, mean of {N_SEEDS} seeds)")
    ax.grid(True, linestyle="--", alpha=0.4)
    ax.legend(loc="upper right", framealpha=0.95)
    fig.tight_layout()

    path = os.path.join(figures_dir, "convergence_by_gens_clean.png")
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote: {path}")


def main():
    results_dir = os.path.join(_HERE, "results")
    figures_dir = os.path.join(_HERE, "figures")
    os.makedirs(results_dir, exist_ok=True)
    os.makedirs(figures_dir, exist_ok=True)

    histories = collect_histories()

    # Persist for future replotting
    save_histories(histories, os.path.join(results_dir, "medium_histories.pkl"))

    # Generate cleaned plots
    plot_convergence_by_evals(histories, figures_dir)
    plot_convergence_by_gens(histories, figures_dir)

    print("\nDone. Outputs:")
    print(f"  {results_dir}\\medium_histories.pkl  (histories for future replotting)")
    print(f"  {figures_dir}\\convergence_by_evals_clean.png  (Figure 2 for paper)")
    print(f"  {figures_dir}\\convergence_by_gens_clean.png  (Figure 3 for paper)")


if __name__ == "__main__":
    main()