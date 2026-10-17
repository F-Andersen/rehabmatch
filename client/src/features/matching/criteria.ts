export const CRITERION_KEYS = [
  "EXPERIENCE",
  "PRICE",
  "RATING",
  "LOCATION",
  "FORMAT",
] as const;

export type CriterionKey = (typeof CRITERION_KEYS)[number];

export const CRITERION_LABELS: Record<CriterionKey, string> = {
  EXPERIENCE: "Досвід роботи",
  PRICE: "Вартість консультації",
  RATING: "Рейтинг спеціаліста",
  LOCATION: "Зручність локації",
  FORMAT: "Формат консультації",
};

export type PairDefinition = {
  criterionA: CriterionKey;
  criterionB: CriterionKey;
  step: number;
};

export const PAIR_STEPS: PairDefinition[] = (() => {
  const pairs: PairDefinition[] = [];
  let step = 1;
  for (let i = 0; i < CRITERION_KEYS.length; i += 1) {
    for (let j = i + 1; j < CRITERION_KEYS.length; j += 1) {
      pairs.push({
        criterionA: CRITERION_KEYS[i],
        criterionB: CRITERION_KEYS[j],
        step,
      });
      step += 1;
    }
  }
  return pairs;
})();

export const SAATY_SCALE = [
  { value: 1, label: "Однакова важливість" },
  { value: 2, label: "2" },
  { value: 3, label: "Помірна перевага" },
  { value: 4, label: "4" },
  { value: 5, label: "Суттєва перевага" },
  { value: 6, label: "6" },
  { value: 7, label: "Сильна перевага" },
  { value: 8, label: "8" },
  { value: 9, label: "Дуже сильна перевага" },
] as const;
