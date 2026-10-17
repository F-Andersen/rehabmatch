import type { CriterionFactor, CriterionKey, WeightsByKey } from "../types.js";

const CRITERION_LABELS: Record<CriterionKey, string> = {
  EXPERIENCE: "Досвід",
  PRICE: "Вартість",
  RATING: "Рейтинг",
  LOCATION: "Локація",
  FORMAT: "Формат консультації",
};

function weightPercent(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

export function buildExplanation(factors: CriterionFactor[], weights: WeightsByKey): string[] {
  const lines: string[] = [];
  const sorted = [...factors].sort((a, b) => b.contribution - a.contribution);

  for (const factor of sorted) {
    const label = CRITERION_LABELS[factor.key];
    const importance = weightPercent(weights[factor.key]);
    if (factor.contribution <= 0) {
      lines.push(`${label}: низький внесок у підсумкову оцінку (${factor.rawLabel}).`);
      continue;
    }
    if (factor.normalizedValue >= 0.85) {
      lines.push(
        `${label} має високу вагу у ваших критеріях (${importance}) і сильний показник: ${factor.rawLabel}.`,
      );
    } else if (factor.normalizedValue >= 0.55) {
      lines.push(
        `${label} враховано з вагою ${importance}; показник помірний: ${factor.rawLabel}.`,
      );
    } else {
      lines.push(
        `${label} (вага ${importance}) має нижчий нормалізований показник: ${factor.rawLabel}.`,
      );
    }
  }

  const top = sorted[0];
  if (top && top.contribution > 0) {
    lines.unshift(
      `Найбільший внесок у відповідність — критерій «${CRITERION_LABELS[top.key]}» (${top.contribution.toFixed(3)}).`,
    );
  }

  lines.push(
    "Підсумкова оцінка відповідності не є клінічною оцінкою ефективності лікування.",
  );

  return lines;
}
