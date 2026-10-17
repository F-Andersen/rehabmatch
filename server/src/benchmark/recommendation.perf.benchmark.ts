import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPairwiseAhp } from "../algorithms/ahp/pairwise.js";
import { filterCandidates } from "../algorithms/scoring/filters.js";
import { scoreSpecialist } from "../algorithms/scoring/score-specialist.js";
import type { CriterionKey, WeightsByKey } from "../algorithms/types.js";
import { FIXED_FILTERS, generateSyntheticSpecialists } from "./synthetic-specialists.js";

const REPEATS = 50;
const WARMUP = 10;
const SIZES = [50, 100, 250, 500];

const equalComparisons = [
  { criterionA: "EXPERIENCE" as CriterionKey, criterionB: "PRICE" as CriterionKey, value: 1 },
  { criterionA: "EXPERIENCE" as CriterionKey, criterionB: "RATING" as CriterionKey, value: 1 },
  { criterionA: "EXPERIENCE" as CriterionKey, criterionB: "LOCATION" as CriterionKey, value: 1 },
  { criterionA: "EXPERIENCE" as CriterionKey, criterionB: "FORMAT" as CriterionKey, value: 1 },
  { criterionA: "PRICE" as CriterionKey, criterionB: "RATING" as CriterionKey, value: 1 },
  { criterionA: "PRICE" as CriterionKey, criterionB: "LOCATION" as CriterionKey, value: 1 },
  { criterionA: "PRICE" as CriterionKey, criterionB: "FORMAT" as CriterionKey, value: 1 },
  { criterionA: "RATING" as CriterionKey, criterionB: "LOCATION" as CriterionKey, value: 1 },
  { criterionA: "RATING" as CriterionKey, criterionB: "FORMAT" as CriterionKey, value: 1 },
  { criterionA: "LOCATION" as CriterionKey, criterionB: "FORMAT" as CriterionKey, value: 1 },
];

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function stats(samplesMs: number[]) {
  const sorted = [...samplesMs].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    mean: sum / sorted.length,
  };
}

type PhaseTiming = {
  filterMs: number;
  normalizeScoreMs: number;
  rankMs: number;
  totalMs: number;
};

function runPhases(
  specialists: ReturnType<typeof generateSyntheticSpecialists>,
  weights: WeightsByKey,
): PhaseTiming {
  const t0 = performance.now();
  const eligible = filterCandidates(specialists, FIXED_FILTERS);
  const t1 = performance.now();

  const scored = eligible.map((specialist) => scoreSpecialist(specialist, weights, FIXED_FILTERS));
  const t2 = performance.now();

  [...scored].sort((a, b) => b.score - a.score);
  const t3 = performance.now();

  return {
    filterMs: t1 - t0,
    normalizeScoreMs: t2 - t1,
    rankMs: t3 - t2,
    totalMs: t3 - t0,
  };
}

function benchSize(count: number, weights: WeightsByKey) {
  const pool = generateSyntheticSpecialists(count);
  for (let i = 0; i < WARMUP; i += 1) {
    runPhases(pool, weights);
  }

  const filter: number[] = [];
  const normalizeScore: number[] = [];
  const rank: number[] = [];
  const total: number[] = [];

  for (let i = 0; i < REPEATS; i += 1) {
    const sample = runPhases(pool, weights);
    filter.push(sample.filterMs);
    normalizeScore.push(sample.normalizeScoreMs);
    rank.push(sample.rankMs);
    total.push(sample.totalMs);
  }

  return {
    count,
    filter: stats(filter),
    normalizeScore: stats(normalizeScore),
    rank: stats(rank),
    total: stats(total),
    eligibleAfterFilter: filterCandidates(pool, FIXED_FILTERS).length,
  };
}

const weights = runPairwiseAhp({ comparisons: equalComparisons }).weights;
const results = SIZES.map((size) => benchSize(size, weights));

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const thesisDir = join(repoRoot, "docs/thesis");
const csvLines = [
  "specialists,phase,median_ms,p95_ms,min_ms,max_ms,mean_ms,repeats,warmup",
];
for (const row of results) {
  for (const phase of ["filter", "normalizeScore", "rank", "total"] as const) {
    const s = row[phase];
    csvLines.push(
      `${row.count},${phase},${s.median.toFixed(4)},${s.p95.toFixed(4)},${s.min.toFixed(4)},${s.max.toFixed(4)},${s.mean.toFixed(4)},${REPEATS},${WARMUP}`,
    );
  }
}

writeFileSync(join(thesisDir, "benchmark-results.csv"), csvLines.join("\n"), "utf-8");

const md = [
  "# Benchmark recommendation engine (synthetic)",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Methodology",
  `- Node.js ${process.version}, in-process pure algorithm (no HTTP/DB).`,
  `- Synthetic specialists: deterministic generator, shared hard filters.`,
  `- AHP weights: equal-importance pairwise comparisons (CR=0).`,
  `- Warmup: ${WARMUP} iterations; measured repeats: ${REPEATS}.`,
  `- Phases: filter → normalize+score (per candidate) → sort rank.`,
  "",
  "## Results (median / p95 ms)",
  "",
  "| N | Eligible | Filter med | Filter p95 | Score med | Score p95 | Rank med | Rank p95 | Total med | Total p95 |",
  "|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
];

for (const row of results) {
  md.push(
    `| ${row.count} | ${row.eligibleAfterFilter} | ${row.filter.median.toFixed(3)} | ${row.filter.p95.toFixed(3)} | ${row.normalizeScore.median.toFixed(3)} | ${row.normalizeScore.p95.toFixed(3)} | ${row.rank.median.toFixed(3)} | ${row.rank.p95.toFixed(3)} | ${row.total.median.toFixed(3)} | ${row.total.p95.toFixed(3)} |`,
  );
}

writeFileSync(join(thesisDir, "benchmark-results.md"), md.join("\n"), "utf-8");

console.log(JSON.stringify({ results }, null, 2));
