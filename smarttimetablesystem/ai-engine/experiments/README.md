# Phase 5 Benchmark Harness

Runs the four GA variants across three instance sizes and multiple random seeds, producing the tables and figures used in the paper.

## Quick start

Activate your virtual environment and change to the `ai-engine` directory. Then choose one of:

**Quick sanity check** (~2–5 minutes, 20 runs on the Medium instance):
```
python -m experiments.verify_medium
```

**Full benchmark** (~30–60 minutes, 360 runs across all sizes and seeds):
```
python -m experiments.run_benchmark
```

## What it does

- Builds synthetic timetabling instances at three sizes (`Small`, `Medium`, `Large`) using deterministic seeds
- Runs the four algorithms defined by the paper:
  - Standard GA (generational, elitist)
  - Steady-State GA
  - Memetic algorithm with canonical single-move local search
  - Memetic algorithm with domain-aware local search (proposed contribution)
- Records fitness, hard-constraint violations, soft-constraint violations, fitness evaluations, and wall-clock runtime per run
- Aggregates into mean ± standard deviation tables
- Runs Welch's t-test on pairwise algorithm comparisons
- Produces convergence and scalability figures for the paper

## Outputs

The harness auto-creates two folders next to itself:

**`results/`** — CSV tables
- `raw_runs.csv` — one row per run (360 rows total)
- `summary_table.csv` — aggregated mean ± std per (algorithm, size) pair (12 rows)
- `significance.csv` — Welch's t-test p-values for all pairwise comparisons

**`figures/`** — publication-ready PNGs
- `convergence_by_evals.png` — mean best-fitness vs. number of evaluations, all four algorithms overlaid, ±1 std band. Fair comparison because both generational and steady-state approaches share the same evaluation budget (2400).
- `convergence_by_gens.png` — same data plotted against generation number for reader intuition. **Not a fair comparison** — each algorithm does different work per generation. Report `convergence_by_evals.png` as the headline figure.
- `scalability.png` — evaluations to convergence across Small / Medium / Large instances

## Instance specifications

| Size | Divisions | Teachers | Subjects/div (theory + lab) | Classrooms | Lab rooms |
|---|---|---|---|---|---|
| Small | 2 | 12 | 4 + 2 = 6 | 6 | 3 |
| Medium | 3 | 18 | 5 + 3 = 8 | 8 | 4 |
| Large | 5 | 30 | 6 + 4 = 10 | 12 | 6 |

All instances use 5 days × 6 timeslots/day = 30 timeslots (before break removal). One break slot is chosen per day between 11:00 and 14:00.

## Reproducibility

- Each seed produces the same instance deterministically via `random.Random(seed)` in `benchmark_utils.build_instance()`.
- Each algorithm run is seeded with `random.seed(seed)` before starting so results are reproducible across machines.
- The harness records everything in CSV so you can re-plot or re-analyze without re-running.

## Which numbers go in the paper

- Tables IV / V / VI → `results/summary_table.csv`
- Statistical significance annotations → `results/significance.csv`
- Figure 2 (headline) → `figures/convergence_by_evals.png`
- Figure 3 (supporting) → `figures/convergence_by_gens.png`
- Figure 4 → `figures/scalability.png`