# Benchmark recommendation engine (synthetic)

Generated: 2026-10-17T16:06:19.787Z

## Methodology
- Node.js v24.14.1, in-process pure algorithm (no HTTP/DB).
- Synthetic specialists: deterministic generator, shared hard filters.
- AHP weights: equal-importance pairwise comparisons (CR=0).
- Warmup: 10 iterations; measured repeats: 50.
- Phases: filter → normalize+score (per candidate) → sort rank.

## Results (median / p95 ms)

| N | Eligible | Filter med | Filter p95 | Score med | Score p95 | Rank med | Rank p95 | Total med | Total p95 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 50 | 50 | 0.001 | 0.003 | 0.092 | 0.222 | 0.004 | 0.006 | 0.099 | 0.235 |
| 100 | 100 | 0.003 | 0.005 | 0.136 | 0.370 | 0.010 | 0.015 | 0.150 | 0.384 |
| 250 | 250 | 0.006 | 0.011 | 0.505 | 0.982 | 0.032 | 0.061 | 0.553 | 1.050 |
| 500 | 500 | 0.009 | 0.019 | 0.622 | 1.247 | 0.070 | 0.122 | 0.692 | 1.379 |