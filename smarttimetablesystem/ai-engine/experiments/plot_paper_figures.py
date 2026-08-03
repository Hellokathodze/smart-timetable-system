"""
Regenerate paper figures from persisted histories + CSVs.

Reads:
- results/medium_histories.pkl (for convergence plots)
- results/raw_runs.csv (for runtime bar chart)

Style knobs at the top — tweak and rerun for instant restyling.

Usage (from ai-engine/ folder with venv active):
    python -m experiments.plot_paper_figures
"""

import os
import sys
import csv
import pickle
from collections import defaultdict

_HERE = os.path.dirname(os.path.abspath(__file__))
_AI_ENGINE = os.path.dirname(_HERE)
if _AI_ENGINE not in sys.path:
    sys.path.insert(0, _AI_ENGINE)

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from experiments.run_benchmark import (
    ALGO_LABELS, ALGO_COLORS, ALGORITHMS, INSTANCE_SIZES,
)


# -------------------------------------------------
# STYLE KNOBS — tweak and rerun for instant restyle
# -------------------------------------------------
STYLE = {
    "figsize": (7, 4.5),
    "dpi": 200,
    "linewidth": 2.5,
    "band_alpha": 0.08,
    "ylim_convergence": (395, 560),
    "grid_alpha": 0.4,
    "legend_loc_convergence": "upper right",
    "legend_loc_runtime": "upper left",
    "bar_width": 0.2,
    "bar_alpha": 0.85,
    "bar_edge_width": 0.4,
    "runtime_log_scale": True,
}


def _mean_std(vals):
    n = len(vals)
    if n == 0:
        return 0.0, 0.0
    m = sum(vals) / n
    var = sum((v - m) ** 2 for v in vals) / (n - 1) if n > 1 else 0.0
    return m, var ** 0.5


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


def plot_convergence_by_evals(histories, figures_dir, n_seeds):
    grid = np.linspace(30, 10000, 120)
    fig, ax = plt.subplots(figsize=STYLE["figsize"], dpi=STYLE["dpi"])

    for algo in ALGORITHMS:
        runs = histories.get(algo, [])
        if not runs:
            continue
        interp = np.stack([
            _interpolate_to_grid(r["eval_history"], r["fitness_history"], grid)
            for r in runs
        ])
        penalty = 100 - interp
        mean = np.nanmean(penalty, axis=0)
        std = np.nanstd(penalty, axis=0)

        ax.plot(grid, mean, color=ALGO_COLORS[algo],
                label=ALGO_LABELS[algo], linewidth=STYLE["linewidth"])
        ax.fill_between(grid, mean - std, mean + std,
                        color=ALGO_COLORS[algo],
                        alpha=STYLE["band_alpha"], linewidth=0)

    ax.set_xlabel("Fitness Evaluations")
    ax.set_ylabel("Total Penalty (lower is better)")
    ax.set_ylim(*STYLE["ylim_convergence"])
    ax.set_xlim(0, 10000)
    ax.set_title(f"Convergence Comparison (Medium instance, mean of {n_seeds} seeds)")
    ax.grid(True, linestyle="--", alpha=STYLE["grid_alpha"])
    ax.legend(loc=STYLE["legend_loc_convergence"], framealpha=0.95)
    fig.tight_layout()

    path = os.path.join(figures_dir, "convergence_by_evals_clean.png")
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote: {path}")


def plot_convergence_by_gens(histories, figures_dir, n_seeds):
    fig, ax = plt.subplots(figsize=STYLE["figsize"], dpi=STYLE["dpi"])

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
        penalty = 100 - padded
        gens = np.arange(1, max_len + 1)
        mean = penalty.mean(axis=0)
        std = penalty.std(axis=0)

        ax.plot(gens, mean, color=ALGO_COLORS[algo],
                label=ALGO_LABELS[algo], linewidth=STYLE["linewidth"])
        ax.fill_between(gens, mean - std, mean + std,
                        color=ALGO_COLORS[algo],
                        alpha=STYLE["band_alpha"], linewidth=0)

    ax.set_xlabel("Generation / Iteration")
    ax.set_ylabel("Total Penalty (lower is better)")
    ax.set_ylim(*STYLE["ylim_convergence"])
    ax.set_title(f"Convergence by Generation (Medium instance, mean of {n_seeds} seeds)")
    ax.grid(True, linestyle="--", alpha=STYLE["grid_alpha"])
    ax.legend(loc=STYLE["legend_loc_convergence"], framealpha=0.95)
    fig.tight_layout()

    path = os.path.join(figures_dir, "convergence_by_gens_clean.png")
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote: {path}")


def plot_runtime_bars(csv_path, figures_dir):
    """Grouped bar chart: runtime by algorithm x instance size."""
    if not os.path.exists(csv_path):
        print(f"WARN: raw_runs.csv not found at {csv_path}; skipping runtime chart")
        return

    rows = list(csv.DictReader(open(csv_path)))
    by_key = defaultdict(list)
    for r in rows:
        by_key[(r["algorithm"], r["size"])].append(float(r["runtime_s"]))

    n_seeds = max(len(v) for v in by_key.values())

    means = {a: [] for a in ALGORITHMS}
    stds = {a: [] for a in ALGORITHMS}
    for algo in ALGORITHMS:
        for size in INSTANCE_SIZES:
            vals = by_key.get((algo, size), [])
            m, s = _mean_std(vals)
            means[algo].append(m)
            stds[algo].append(s)

    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=STYLE["dpi"])
    x = np.arange(len(INSTANCE_SIZES))
    bw = STYLE["bar_width"]

    for i, algo in enumerate(ALGORITHMS):
        offset = (i - 1.5) * bw
        ax.bar(x + offset, means[algo], bw,
               yerr=stds[algo],
               label=ALGO_LABELS[algo],
               color=ALGO_COLORS[algo],
               capsize=3,
               edgecolor="black",
               linewidth=STYLE["bar_edge_width"],
               alpha=STYLE["bar_alpha"])

    ax.set_xticks(x)
    ax.set_xticklabels(INSTANCE_SIZES)
    ax.set_xlabel("Instance Size")
    ylabel = "Wall-clock Runtime (seconds"
    if STYLE["runtime_log_scale"]:
        ax.set_yscale("log")
        ylabel += ", log scale"
    ylabel += ")"
    ax.set_ylabel(ylabel)
    ax.set_title(f"Wall-clock Runtime Comparison (mean +/- std over {n_seeds} seeds)")
    ax.grid(True, axis="y", which="both", linestyle="--", alpha=STYLE["grid_alpha"])
    ax.legend(loc=STYLE["legend_loc_runtime"], framealpha=0.95)
    fig.tight_layout()

    path = os.path.join(figures_dir, "runtime_bars.png")
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote: {path}")


def main():
    results_dir = os.path.join(_HERE, "results")
    figures_dir = os.path.join(_HERE, "figures")
    pkl_path = os.path.join(results_dir, "medium_histories.pkl")
    csv_path = os.path.join(results_dir, "raw_runs.csv")

    # Convergence plots need histories
    if os.path.exists(pkl_path):
        with open(pkl_path, "rb") as f:
            histories = pickle.load(f)
        n_seeds = max(len(v) for v in histories.values())
        print(f"Loaded histories: {len(histories)} algorithms, up to {n_seeds} seeds")
        plot_convergence_by_evals(histories, figures_dir, n_seeds)
        plot_convergence_by_gens(histories, figures_dir, n_seeds)
    else:
        print(f"WARN: no histories at {pkl_path}; skipping convergence plots")
        print("      Run `python -m experiments.replot_medium` first.")

    # Runtime bar chart needs raw_runs.csv only
    plot_runtime_bars(csv_path, figures_dir)

    print("\nDone.")


if __name__ == "__main__":
    main()