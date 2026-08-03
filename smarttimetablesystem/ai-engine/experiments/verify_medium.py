"""
Quick reproducibility check — Medium instance only, all 4 algorithms,
5 seeds each = 20 runs. Takes ~2-5 minutes on a typical laptop.

Use this to verify the harness works and produces reasonable numbers
without waiting for the full 360-run benchmark.

Usage (from ai-engine/ folder, venv active):
    python -m experiments.verify_medium

Or:
    cd experiments
    python verify_medium.py
"""

import os
import sys
import time
import statistics

_HERE = os.path.dirname(os.path.abspath(__file__))
_AI_ENGINE = os.path.dirname(_HERE)
if _AI_ENGINE not in sys.path:
    sys.path.insert(0, _AI_ENGINE)

from experiments.benchmark_utils import build_instance, count_violations
from experiments.run_benchmark import ALGORITHM_RUNNERS, ALGO_LABELS, ALGORITHMS


VERIFY_SEEDS = [0, 1, 2, 3, 4]
SIZE = "Medium"


def _mean_std(vals):
    if not vals:
        return 0.0, 0.0
    m = statistics.mean(vals)
    s = statistics.stdev(vals) if len(vals) > 1 else 0.0
    return m, s


def main():
    print(f"Verify: {SIZE} instance, {len(ALGORITHMS)} algorithms, {len(VERIFY_SEEDS)} seeds each")
    print(f"Total runs: {len(ALGORITHMS) * len(VERIFY_SEEDS)}")
    print()

    results = {algo: {"fitness": [], "hard": [], "soft": [], "evals": [], "runtime": []}
               for algo in ALGORITHMS}

    total = len(ALGORITHMS) * len(VERIFY_SEEDS)
    done = 0
    t_start = time.perf_counter()

    for seed in VERIFY_SEEDS:
        data = build_instance(SIZE, seed)
        subject_types = {s["id"]: s.get("type", "THEORY") for s in data["subjects"]}
        room_types = {r["id"]: r.get("type", "CLASSROOM") for r in data["rooms"]}

        for algo in ALGORITHMS:
            t0 = time.perf_counter()
            result = ALGORITHM_RUNNERS[algo](data, seed)
            runtime = time.perf_counter() - t0

            viol = count_violations(
                result["timetable"], subject_types, room_types, result["break_map"]
            )

            results[algo]["fitness"].append(result["fitness"])
            results[algo]["hard"].append(viol["hard_total"])
            results[algo]["soft"].append(viol["soft_total"])
            results[algo]["evals"].append(result["evaluations"])
            results[algo]["runtime"].append(runtime)

            done += 1
            print(f"  [{done}/{total}] seed={seed} algo={algo:22s} "
                  f"fit={result['fitness']:5.1f} viol={viol['hard_total']}/{viol['soft_total']} "
                  f"evals={result['evaluations']:4d} runtime={runtime:5.2f}s")

    elapsed = time.perf_counter() - t_start
    print(f"\nAll runs complete in {elapsed:.1f}s ({elapsed/60:.1f} min)")

    # Summary table
    print()
    print("=" * 100)
    print(f"{'Algorithm':22s} | {'Fitness':>14s} | {'Hard Viol':>12s} | {'Soft Viol':>12s} | {'Evaluations':>13s} | {'Runtime (s)':>12s}")
    print("-" * 100)
    for algo in ALGORITHMS:
        r = results[algo]
        f_m, f_s = _mean_std(r["fitness"])
        h_m, h_s = _mean_std(r["hard"])
        s_m, s_s = _mean_std(r["soft"])
        e_m, e_s = _mean_std(r["evals"])
        rt_m, rt_s = _mean_std(r["runtime"])
        print(f"{ALGO_LABELS[algo]:22s} | "
              f"{f_m:6.1f} \u00b1 {f_s:4.1f}  | "
              f"{h_m:5.1f} \u00b1 {h_s:4.1f} | "
              f"{s_m:5.1f} \u00b1 {s_s:4.1f} | "
              f"{e_m:6.1f} \u00b1 {e_s:5.1f} | "
              f"{rt_m:5.2f} \u00b1 {rt_s:4.2f}")
    print("=" * 100)
    print(f"\nSample size: {len(VERIFY_SEEDS)} seeds (not statistically robust — use run_benchmark.py for 30 seeds)")


if __name__ == "__main__":
    main()