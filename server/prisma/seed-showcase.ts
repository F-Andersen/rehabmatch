import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CriterionKey,
  CriterionType,
  PreferenceMode,
  Prisma,
  PrismaClient,
  ReviewStatus,
  SpecialistStatus,
  UserRole,
  AppointmentRequestStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { assertSafeShowcaseDatabase } from "../src/lib/showcase-database-guard.js";
import { recalculateSpecialistRating } from "../src/modules/reviews/rating-aggregate.js";
import { createRecommendation } from "../src/modules/recommendations/recommendation.service.js";
import { createSearchRequest } from "../src/modules/search/search.service.js";
import { loadShowcaseProfiles } from "./showcase/profiles.js";

const prismaDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(prismaDir, "../..");

config({ path: path.join(repoRoot, ".env.showcase") });
config({ path: path.join(repoRoot, ".env") });

const databaseUrl = process.env.SHOWCASE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Set SHOWCASE_DATABASE_URL in .env.showcase");
}
assertSafeShowcaseDatabase(databaseUrl);

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const CITY_DISTRICTS: Record<string, string[]> = {
  Київ: ["Центральний", "Північний", "Південний"],
  Львів: ["Центральний", "Північний", "Західний"],
  Дніпро: ["Центральний", "Північний", "Східний"],
  Одеса: ["Центральний", "Північний", "Приморський"],
  Харків: ["Центральний", "Північний", "Салтівський"],
  Суми: ["Центральний", "Північний", "Західний"],
};

const SPECIALIZATIONS = [
  { name: "Фізична терапія", description: "Відновлення рухових функцій" },
  { name: "Ерготерапія", description: "Адаптація повсякденної активності" },
  { name: "Реабілітаційна медицина", description: "Комплексне відновлення" },
  { name: "Логопедія", description: "Мовленнєва реабілітація" },
  { name: "Спортивна реабілітація", description: "Повернення до спорту" },
];

const INJURY_TYPES = [
  { name: "Післяопераційне відновлення", description: "Відновлення після хірургічного втручання" },
  { name: "Спортивні травми", description: "Реабілітація після спортивних ушкоджень" },
  { name: "Порушення опорно-рухового апарату", description: "Робота з болем у спині, суглобах і поставою" },
  { name: "Неврологічна реабілітація", description: "Підтримка після неврологічних станів" },
  { name: "Відновлення рухливості", description: "Покращення ходи, балансу та самообслуговування" },
];

const APPOINTMENT_FORMATS = ["Очно", "Онлайн", "Змішаний"];

const CRITERIA = [
  { key: CriterionKey.EXPERIENCE, name: "Досвід роботи", description: "Стаж", criterionType: CriterionType.BENEFIT },
  { key: CriterionKey.PRICE, name: "Вартість послуг", description: "Ціна", criterionType: CriterionType.COST },
  { key: CriterionKey.RATING, name: "Рейтинг та відгуки", description: "Оцінки", criterionType: CriterionType.BENEFIT },
  { key: CriterionKey.LOCATION, name: "Локація", description: "Місто", criterionType: CriterionType.MATCH },
  { key: CriterionKey.FORMAT, name: "Формат консультації", description: "Формат", criterionType: CriterionType.MATCH },
];

const EXTRA_SERVICES = [
  { name: "Первинна консультація", desc: "Збір скарг, огляд рухів і план першого етапу відновлення." },
  { name: "Оцінювання функціонального стану", desc: "Тести сили, рухливості та переносимості навантаження." },
  { name: "Індивідуальне заняття", desc: "Персональна сесія з корекцією техніки вправ." },
  { name: "Рекомендації для домашніх вправ", desc: "Підбір безпечного комплексу з поясненням частоти." },
  { name: "Онлайн-супровід", desc: "Коротка відеоконсультація для уточнення самопочуття між візитами." },
];

const PATIENT_NAMES = [
  "Олег Виноградов",
  "Лілія Герасименко",
  "Михайло Даниленко",
  "Аліна Черкасова",
  "Вадим Скороход",
  "Єлизавета Рябко",
  "Федір Ковтун",
  "Поліна Мазур",
  "Арсен Луценко",
  "Діана Борисенко",
  "Ілля Гладкий",
  "Надія Коваль",
  "Степан Яковенко",
  "Віра Комар",
  "Леонід Приходько",
  "Мілана Савчук",
  "Георгій Нечипорук",
  "Ксенія Баран",
  "Руслан Шпак",
  "Жанна Кириленко",
  "Аркадій Міщенко",
  "Орися Волошина",
  "Денис Гордієнко",
  "Карина Лазаренко",
  "Тимофій Зінченко",
];

const REVIEW_COMMENTS = [
  "Зрозуміло пояснили, як виконувати вправи вдома, без зайвого тиску.",
  "Запис пройшов вчасно, відчувся уважний підхід до деталей.",
  "Онлайн-формат виявився зручним, зв’язок стабільний.",
  "Ціна відповідає обсягу роботи на прийомі.",
  "Приміщення зручне, є місце для очікування.",
  "Після кількох зустрічей помітив більше впевненості в рухах.",
  "Хотілося б трохи більше часу на запитання, але загалом задоволений.",
  "Комунікація спокійна, без медичних обіцянок, що все зникне за день.",
  "Добре структурований план на тиждень між візитами.",
  "Підтримали під час повернення до легких тренувань.",
];

async function hashPassword(raw: string): Promise<string> {
  return bcrypt.hash(raw, 12);
}

function showcaseEmail(kind: string, id: string): string {
  return `${kind}.${id.toLowerCase()}@example.test`.replace("..", ".");
}

async function seedDictionaries() {
  const districtKeyToId = new Map<string, string>();
  for (const [cityName, districts] of Object.entries(CITY_DISTRICTS)) {
    const city = await prisma.city.upsert({
      where: { name: cityName },
      create: { name: cityName },
      update: {},
    });
    for (const districtName of districts) {
      const district = await prisma.district.upsert({
        where: { cityId_name: { cityId: city.id, name: districtName } },
        create: { cityId: city.id, name: districtName },
        update: {},
      });
      districtKeyToId.set(`${cityName}::${districtName}`, district.id);
    }
  }

  const specializationByName = new Map<string, string>();
  const injuryByName = new Map<string, string>();
  const formatByName = new Map<string, string>();

  for (const item of SPECIALIZATIONS) {
    const record = await prisma.specialization.upsert({
      where: { name: item.name },
      create: item,
      update: { description: item.description },
    });
    specializationByName.set(item.name, record.id);
  }
  for (const item of INJURY_TYPES) {
    const record = await prisma.injuryType.upsert({
      where: { name: item.name },
      create: item,
      update: { description: item.description },
    });
    injuryByName.set(item.name, record.id);
  }
  for (const name of APPOINTMENT_FORMATS) {
    const record = await prisma.appointmentFormat.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    formatByName.set(name, record.id);
  }
  for (const item of CRITERIA) {
    await prisma.criterion.upsert({
      where: { key: item.key },
      create: item,
      update: { name: item.name, description: item.description, criterionType: item.criterionType, isActive: true },
    });
  }

  return { districtKeyToId, specializationByName, injuryByName, formatByName };
}

async function seedAdmin(password: string) {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.test").toLowerCase();
  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    create: { email, fullName: "Адміністратор RehabMatch", passwordHash, role: UserRole.ADMIN },
    update: { fullName: "Адміністратор RehabMatch", passwordHash, role: UserRole.ADMIN, isActive: true },
  });
}

async function seedSpecialists(
  password: string,
  maps: Awaited<ReturnType<typeof seedDictionaries>>,
) {
  const passwordHash = await hashPassword(password);
  const profiles = loadShowcaseProfiles();
  const specialistIds: string[] = [];

  for (const row of profiles) {
    const email = showcaseEmail("specialist", row.showcaseId);
    const districtId = maps.districtKeyToId.get(`${row.city}::${row.district}`);
    const city = await prisma.city.findUnique({ where: { name: row.city } });
    if (!city || !districtId) throw new Error(`Missing city for ${row.showcaseId}`);

    const user = await prisma.user.upsert({
      where: { email },
      create: { email, fullName: row.fullName, passwordHash, role: UserRole.SPECIALIST },
      update: { fullName: row.fullName, passwordHash, role: UserRole.SPECIALIST, isActive: true },
    });

    const verifiedAt = row.verificationStatus === SpecialistStatus.APPROVED ? new Date("2025-06-01") : null;
    const specialist = await prisma.specialist.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        cityId: city.id,
        districtId,
        experienceYears: row.experienceYears,
        pricePerSession: new Prisma.Decimal(row.pricePerSessionUah),
        description: row.description,
        photoUrl: row.photoPath,
        inclusiveSpace: row.inclusiveSpace,
        verificationStatus: row.verificationStatus,
        verifiedAt,
        isDemo: false,
        isVisible: true,
      },
      update: {
        cityId: city.id,
        districtId,
        experienceYears: row.experienceYears,
        pricePerSession: new Prisma.Decimal(row.pricePerSessionUah),
        description: row.description,
        photoUrl: row.photoPath,
        inclusiveSpace: row.inclusiveSpace,
        verificationStatus: row.verificationStatus,
        verifiedAt,
        isDemo: false,
        isVisible: true,
      },
    });
    specialistIds.push(specialist.id);

    const specializationId = maps.specializationByName.get(row.specialization)!;
    const injuryTypeId = maps.injuryByName.get(row.injuryType)!;
    const formatId = maps.formatByName.get(row.appointmentFormat)!;

    await prisma.specialistSpecialization.upsert({
      where: { specialistId_specializationId: { specialistId: specialist.id, specializationId } },
      create: { specialistId: specialist.id, specializationId },
      update: {},
    });
    await prisma.specialistInjuryType.upsert({
      where: { specialistId_injuryTypeId: { specialistId: specialist.id, injuryTypeId } },
      create: { specialistId: specialist.id, injuryTypeId },
      update: {},
    });
    await prisma.specialistAppointmentFormat.upsert({
      where: { specialistId_formatId: { specialistId: specialist.id, formatId } },
      create: { specialistId: specialist.id, formatId },
      update: {},
    });

    const basePrice = row.pricePerSessionUah;
    const serviceDefs = [
      { name: "Базова консультація", description: "Перший огляд і узгодження цілей відновлення.", price: basePrice },
      ...EXTRA_SERVICES.slice(0, 2 + (specialistIds.length % 3)).map((svc, idx) => ({
        name: svc.name,
        description: svc.desc,
        price: Math.round(basePrice * (0.85 + idx * 0.12)),
      })),
    ];

    for (const svc of serviceDefs) {
      const existing = await prisma.service.findFirst({
        where: { specialistId: specialist.id, name: svc.name },
      });
      if (existing) {
        await prisma.service.update({
          where: { id: existing.id },
          data: { description: svc.description, price: new Prisma.Decimal(svc.price), isActive: true },
        });
      } else {
        await prisma.service.create({
          data: {
            specialistId: specialist.id,
            name: svc.name,
            description: svc.description,
            price: new Prisma.Decimal(svc.price),
            isActive: true,
          },
        });
      }
    }
  }
  return specialistIds;
}

async function seedPatients(password: string) {
  const passwordHash = await hashPassword(password);
  const patientIds: string[] = [];
  const kyiv = await prisma.city.findUnique({ where: { name: "Київ" } });

  for (let i = 0; i < PATIENT_NAMES.length; i += 1) {
    const id = `patient-${String(i + 1).padStart(2, "0")}`;
    const email = showcaseEmail("showcase", id);
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, fullName: PATIENT_NAMES[i], passwordHash, role: UserRole.PATIENT },
      update: { fullName: PATIENT_NAMES[i], passwordHash, role: UserRole.PATIENT, isActive: true },
    });
    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      create: { userId: user.id, cityId: kyiv?.id },
      update: { cityId: kyiv?.id },
    });
    patientIds.push(patient.id);
  }
  return patientIds;
}

async function seedReviews(patientIds: string[]) {
  const existingReviews = await prisma.review.count();
  if (existingReviews >= 120) {
    return;
  }
  const approved = await prisma.specialist.findMany({
    where: { verificationStatus: SpecialistStatus.APPROVED },
    select: { id: true },
  });
  let created = 0;
  for (let p = 0; p < patientIds.length && created < 130; p += 1) {
    for (let s = 0; s < approved.length && created < 130; s += 1) {
      if ((p * 11 + s * 7) % 5 === 0) continue;
      const rating = 3 + ((p + s) % 3);
      const statusRoll = (p + s) % 10;
      const status =
        statusRoll < 7 ? ReviewStatus.APPROVED : statusRoll < 9 ? ReviewStatus.PENDING : ReviewStatus.REJECTED;
      const comment = REVIEW_COMMENTS[(p + s) % REVIEW_COMMENTS.length];
      const daysAgo = 10 + ((p * s) % 120);
      const createdAt = new Date(Date.now() - daysAgo * 86400000);

      await prisma.review.upsert({
        where: { patientId_specialistId: { patientId: patientIds[p], specialistId: approved[s].id } },
        create: {
          patientId: patientIds[p],
          specialistId: approved[s].id,
          rating,
          comment,
          status,
          createdAt,
        },
        update: { rating, comment, status },
      });
      created += 1;
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const spec of approved) {
      await recalculateSpecialistRating(spec.id, tx);
    }
  });
}

async function seedAppointments(patientIds: string[]) {
  const existing = await prisma.appointmentRequest.count();
  if (existing >= 28) {
    return existing;
  }
  const approved = await prisma.specialist.findMany({
    where: { verificationStatus: SpecialistStatus.APPROVED },
    include: { user: true },
    take: 30,
  });
  const statuses: AppointmentRequestStatus[] = [
    AppointmentRequestStatus.REQUESTED,
    AppointmentRequestStatus.ACCEPTED,
    AppointmentRequestStatus.DECLINED,
    AppointmentRequestStatus.CANCELLED,
  ];
  let count = 0;
  for (let i = 0; i < 28; i += 1) {
    const patientId = patientIds[i % patientIds.length];
    const specialist = approved[i % approved.length];
    const preferredAt = new Date(Date.now() + (3 + i) * 86400000);
    const status = statuses[i % statuses.length];
    const existing = await prisma.appointmentRequest.findFirst({
      where: { patientId, specialistId: specialist.id, preferredAt },
    });
    if (existing) continue;
    await prisma.appointmentRequest.create({
      data: {
        patientId,
        specialistId: specialist.id,
        preferredAt,
        status,
        note: "Запит на консультацію для узгодження програми відновлення (навчальні дані).",
      },
    });
    count += 1;
  }
  return count;
}

type Scenario = {
  id: string;
  city: string;
  injuryType: string;
  maxBudgetUah: number;
  mode: PreferenceMode;
  comparisons?: Array<{ criterionA: string; criterionB: string; value: number }>;
  priorities?: Record<string, number>;
};

async function seedRecommendations(patientIds: string[]) {
  const scenarios = JSON.parse(
    readFileSync(path.join(repoRoot, "fixtures/showcase/recommendation-scenarios.json"), "utf8"),
  ) as Scenario[];

  let created = 0;

  for (let index = 0; index < scenarios.length; index += 1) {
    const scenario = scenarios[index];
    const historyPatientId = patientIds[index % patientIds.length];
    const injury = await prisma.injuryType.findFirst({ where: { name: scenario.injuryType } });
    const city = await prisma.city.findFirst({ where: { name: scenario.city } });
    if (!injury || !city) continue;

    const showcaseTag = `showcase:${scenario.id}`;
    let search = await prisma.searchRequest.findFirst({
      where: {
        patientId: historyPatientId,
        filtersSnapshot: { path: ["showcaseTag"], equals: showcaseTag },
      },
    });

    if (!search) {
      const createdSearch = await createSearchRequest(historyPatientId, {
        injuryTypeId: injury.id,
        cityId: city.id,
        maxBudget: scenario.maxBudgetUah,
        preferenceMode: scenario.mode,
        cityOnly: false,
        inclusiveOnly: false,
      });
      search = await prisma.searchRequest.update({
        where: { id: createdSearch.id },
        data: {
          filtersSnapshot: {
            ...(createdSearch.filtersSnapshot as object),
            showcaseTag,
          },
        },
      });
    }

    const existing = await prisma.recommendation.findFirst({ where: { searchRequestId: search.id } });
    if (existing) continue;

    if (scenario.mode === PreferenceMode.AHP_PAIRWISE && scenario.comparisons) {
      await createRecommendation(historyPatientId, {
        searchRequestId: search.id,
        mode: PreferenceMode.AHP_PAIRWISE,
        comparisons: scenario.comparisons as never,
        limit: 5,
      });
    } else if (scenario.mode === PreferenceMode.DIRECT_WSM && scenario.priorities) {
      await createRecommendation(historyPatientId, {
        searchRequestId: search.id,
        mode: PreferenceMode.DIRECT_WSM,
        priorities: scenario.priorities as never,
        limit: 5,
      });
    }
    created += 1;
  }
  return created;
}

async function printSummary() {
  const counts = {
    users: await prisma.user.count(),
    specialists: await prisma.specialist.count(),
    patients: await prisma.patient.count(),
    services: await prisma.service.count(),
    reviews: await prisma.review.count(),
    appointmentRequests: await prisma.appointmentRequest.count(),
    recommendations: await prisma.recommendation.count(),
    withPhoto: await prisma.specialist.count({ where: { photoUrl: { not: null } } }),
  };
  console.log("Showcase seed summary:", counts);
}

async function main() {
  const password = process.env.SHOWCASE_SEED_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.includes("REPLACE")) {
    throw new Error("Set SHOWCASE_SEED_PASSWORD or SEED_ADMIN_PASSWORD in .env.showcase");
  }

  const maps = await seedDictionaries();
  await seedAdmin(password);
  await seedSpecialists(password, maps);
  const patientIds = await seedPatients(password);
  await seedReviews(patientIds);
  await seedAppointments(patientIds);
  await seedRecommendations(patientIds);
  await printSummary();
}

main()
  .catch((error) => {
    console.error("Showcase seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
