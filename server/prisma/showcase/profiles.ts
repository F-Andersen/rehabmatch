import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SpecialistStatus } from "@prisma/client";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export type ShowcaseCsvRow = {
  showcaseId: string;
  city: string;
  district: string;
  specialization: string;
  injuryType: string;
  experienceYears: number;
  pricePerSessionUah: number;
  appointmentFormat: string;
  inclusiveSpace: boolean;
  verificationStatus: SpecialistStatus;
};

const FULL_NAMES: string[] = [
  "Олександр Ковальчук",
  "Марія Шевченко",
  "Андрій Бондаренко",
  "Олена Мельник",
  "Сергій Ткаченко",
  "Наталія Кравченко",
  "Ірина Лисенко",
  "Павло Романенко",
  "Вікторія Гончар",
  "Дмитро Савченко",
  "Юлія Марченко",
  "Роман Поліщук",
  "Анастасія Білоус",
  "Максим Захарченко",
  "Катерина Олійник",
  "Ігор Петренко",
  "Софія Кузьменко",
  "Володимир Іваненко",
  "Ганна Сидоренко",
  "Тарас Мороз",
  "Людмила Руденко",
  "Богдан Чорний",
  "Валентина Семенюк",
  "Артем Левченко",
  "Оксана Павленко",
  "Євген Клименко",
  "Дарина Гриценко",
  "Микола Яременко",
  "Алла Василенко",
  "Станіслав Данилюк",
  "Христина Назаренко",
  "Віталій Корнієнко",
  "Зоряна Федоренко",
  "Олег Бабенко",
  "Лариса Тимошенко",
  "Назар Пономаренко",
  "Інна Костенко",
  "Петро Гуменюк",
  "Світлана Дорошенко",
  "Ярослав Верещак",
  "Уляна Стеценко",
  "Григорій Чубенко",
  "Вероніка Литвин",
  "Кирило Жук",
  "Марина Хоменко",
  "Антон Сорока",
  "Тетяна Пилипенко",
  "Василь Остапенко",
];

const METHOD_SNIPPETS: Record<string, string[]> = {
  "Фізична терапія": [
    "У роботі поєдную оцінку рухового патерну, м’язовий баланс і поступове навантаження.",
    "Планую вправи з урахуванням переносимості та зворотного зв’язку від пацієнта.",
    "Пояснюю мету кожного етапу, щоб людина розуміла логіку відновлення вдома.",
  ],
  Ерготерапія: [
    "Допомагаю адаптувати побутові дії та робочі задачі після травми чи операції.",
    "Підбираю прості технічні рішення для безпечнішого руху вдома та на роботі.",
    "Фокусуюсь на самостійності, а не на миттєвому результаті одного візиту.",
  ],
  "Реабілітаційна медицина": [
    "Будую програму відновлення як послідовність коротких цілей із вимірюваним прогресом.",
    "Узгоджую навантаження з обмеженнями, які озвучує пацієнт, без обіцянок «швидкого вилікування».",
    "Працюю в командному форматі, коли потрібна консультація суміжного фахівця.",
  ],
  Логопедія: [
    "Відновлюю мовлення та комунікацію після неврологічних подій у спокійному темпі.",
    "Використовую вправи на дихання, артикуляцію та розуміння мовлення за показами.",
    "Навчаю близьких, як підтримувати практику між заняттями.",
  ],
  "Спортивна реабілітація": [
    "Повертаю до тренувань через контроль болю, сили та координації.",
    "Планую навантаження з урахуванням виду спорту та етапу після травми.",
    "Пояснюю, коли можна збільшувати інтенсивність, а коли варто зробити паузу.",
  ],
};

function parseCsv(): ShowcaseCsvRow[] {
  const raw = readFileSync(path.join(repoRoot, "fixtures/specialists.csv"), "utf8");
  const lines = raw.trim().split(/\r?\n/).slice(1);
  return lines.map((line, index) => {
    const columns = line.split(",");
    const [
      demoId,
      ,
      city,
      district,
      specialization,
      injuryType,
      experienceYears,
      pricePerSessionUah,
      appointmentFormat,
      inclusiveSpace,
      ,
      verificationStatus,
    ] = columns;
    return {
      showcaseId: `SC-${String(index + 1).padStart(3, "0")}`,
      city,
      district,
      specialization,
      injuryType,
      experienceYears: Number.parseInt(experienceYears, 10),
      pricePerSessionUah: Number.parseInt(pricePerSessionUah, 10),
      appointmentFormat,
      inclusiveSpace: inclusiveSpace === "true",
      verificationStatus: verificationStatus as SpecialistStatus,
    };
  });
}

export function composeDescription(row: ShowcaseCsvRow, fullName: string, index: number): string {
  const snippets = METHOD_SNIPPETS[row.specialization] ?? METHOD_SNIPPETS["Фізична терапія"];
  const a = snippets[index % snippets.length];
  const b = snippets[(index + 1) % snippets.length];
  const years =
    row.experienceYears === 0
      ? "починаю професійний шлях і веду прийом під наглядом досвідчених колег"
      : `маю ${row.experienceYears} років практики у сфері реабілітації`;
  return (
    `${fullName} — фахівець із ${row.specialization.toLowerCase()} у ${row.city} (район ${row.district}). ` +
    `${a} ${b} ` +
    `Працюю з запитами, пов’язаними з «${row.injuryType.toLowerCase()}», ${years}. ` +
    `Формат зустрічей: ${row.appointmentFormat.toLowerCase()}; орієнтовна вартість сеансу — ${row.pricePerSessionUah} грн. ` +
    `${row.inclusiveSpace ? "Кабінет адаптований для зручного пересування." : "За потреби обговорюємо доступність приміщення заздалегідь."} ` +
    `Усі дані профілю навчальні та не є медичною рекомендацією.`
  );
}

export function loadShowcaseProfiles(): Array<ShowcaseCsvRow & { fullName: string; description: string; photoPath: string }> {
  const rows = parseCsv();
  return rows.map((row, index) => {
    const fullName = FULL_NAMES[index] ?? `Спеціаліст ${row.showcaseId}`;
    const slug = row.showcaseId.toLowerCase().replace("sc-", "sc-");
    const photoPath = `/images/specialists/sc-${String(index + 1).padStart(3, "0")}.webp`;
    return {
      ...row,
      fullName,
      description: composeDescription(row, fullName, index),
      photoPath,
    };
  });
}
