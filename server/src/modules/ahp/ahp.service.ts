import { calculateDirectWeights } from "../../algorithms/direct-wsm.js";
import { runPairwiseAhp } from "../../algorithms/ahp/pairwise.js";
import type { z } from "zod";
import type { ahpCalculateBodySchema } from "./ahp.schemas.js";

type CalculateInput = z.infer<typeof ahpCalculateBodySchema>;

export function calculateAhpPreview(input: CalculateInput) {
  if (input.mode === "DIRECT_WSM") {
    const result = calculateDirectWeights({ priorities: input.priorities });
    return {
      mode: result.mode,
      algorithmVersion: result.algorithmVersion,
      weights: result.weights,
      lambdaMax: result.lambdaMax,
      ci: result.ci,
      cr: result.cr,
      isConsistent: result.isConsistent,
      consistencyThreshold: null,
    };
  }

  const result = runPairwiseAhp({
    keys: input.keys,
    comparisons: input.comparisons,
  });

  return {
    mode: result.mode,
    algorithmVersion: result.algorithmVersion,
    weights: result.weights,
    lambdaMax: result.lambdaMax,
    ci: result.ci,
    cr: result.cr,
    isConsistent: result.isConsistent,
    consistencyThreshold: result.consistencyThreshold,
  };
}
