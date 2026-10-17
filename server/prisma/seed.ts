import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CriterionKey,
  CriterionType,
  Prisma,
  PrismaClient,
  SpecialistStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

const prismaDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(prismaDir, "../..");

config({ path: path.join(repoRoot, ".env") });
config({ path: path.join(repoRoot, ".env.example") });

const prisma = new PrismaClient();

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
  { name: "Післяопераційне відновлення", description: "Демо-категорія запиту" },
  { name: "Спортивні травми", description: "Демо-категорія запиту" },
  { name: "Порушення опорно-рухового апарату", description: "Демо-категорія запиту" },
  { name: "Неврологічна реабілітація", description: "Демо-категорія запиту" },
  { name: "Відновлення рухливості", description: "Демо-категорія запиту" },
];

const APPOINTMENT_FORMATS = ["Очно", "Онлайн", "Змішаний"];

const CRITERIA: Array<{
  key: CriterionKey;
  name: string;
  description: string;
  criterionType: CriterionType;
}> = [
  {
    key: CriterionKey.EXPERIENCE,
    name: "Досвід роботи",
    description: "Стаж спеціаліста",
    criterionType: CriterionType.BENEFIT,
  },
  {
    key: CriterionKey.PRICE,
    name: "Вартість послуг",
    description: "Ціна за сеанс",
    criterionType: CriterionType.COST,
  },
  {
    key: CriterionKey.RATING,
    name: "Рейтинг та відгуки",
    description: "Оцінки пацієнтів",
    criterionType: CriterionType.BENEFIT,
  },
  {
    key: CriterionKey.LOCATION,
    name: "Локація",
    description: "Місто та район",
    criterionType: CriterionType.MATCH,
  },
  {
    key: CriterionKey.FORMAT,
    name: "Формат консультації",
    description: "Очно, онлайн або змішаний",
    criterionType: CriterionType.MATCH,
  },
];

const DEMO_PATIENTS = [
  { email: "demo.patient1@example.test", fullName: "Демо Пацієнт Олена" },
  { email: "demo.patient2@example.test", fullName: "Демо Пацієнт Ігор" },
  { email: "demo.patient3@example.test", fullName: "Демо Пацієнт Софія" },
];

const DEMO_PATIENT_PASSWORD = "DemoPatient123!";
const DEMO_SPECIALIST_PASSWORD = "DemoSpecialist123!";

type CsvRow = {
  demoId: string;
  fullName: string;
  city: string;
  district: string;
  specialization: string;
  injuryType: string;
  experienceYears: number;
  pricePerSessionUah: number;
  appointmentFormat: string;
  inclusiveSpace: boolean;
  isDemo: boolean;
  verificationStatus: SpecialistStatus;
  description: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function specialistEmail(demoId: string): string {
  return normalizeEmail(`specialist+${demoId.toLowerCase()}@example.test`);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split(/\r?\n/).slice(1);
  return lines.map((line) => {
    const columns = line.split(",");
    const [
      demoId,
      fullName,
      city,
      district,
      specialization,
      injuryType,
      experienceYears,
      pricePerSessionUah,
      appointmentFormat,
      inclusiveSpace,
      isDemo,
      verificationStatus,
      description,
    ] = columns;

    return {
      demoId,
      fullName,
      city,
      district,
      specialization,
      injuryType,
      experienceYears: Number.parseInt(experienceYears, 10),
      pricePerSessionUah: Number.parseInt(pricePerSessionUah, 10),
      appointmentFormat,
      inclusiveSpace: inclusiveSpace === "true",
      isDemo: isDemo === "true",
      verificationStatus: verificationStatus as SpecialistStatus,
      description,
    };
  });
}

async function seedCitiesAndDistricts(): Promise<Map<string, string>> {
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

  return districtKeyToId;
}

async function seedDictionaries(): Promise<{
  specializationByName: Map<string, string>;
  injuryByName: Map<string, string>;
  formatByName: Map<string, string>;
}> {
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
      update: {
        name: item.name,
        description: item.description,
        criterionType: item.criterionType,
        isActive: true,
      },
    });
  }

  return { specializationByName, injuryByName, formatByName };
}

async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set for seed");
  }

  if (password.includes("REPLACE_WITH")) {
    throw new Error("Set a real local SEED_ADMIN_PASSWORD in .env before running seed");
  }

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      fullName: "Демо Адміністратор",
      passwordHash,
      role: UserRole.ADMIN,
    },
    update: {
      fullName: "Демо Адміністратор",
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
}

async function seedPatients(districtKeyToId: Map<string, string>): Promise<void> {
  const kyivDistrictId = districtKeyToId.get("Київ::Центральний");
  const passwordHash = await hashPassword(DEMO_PATIENT_PASSWORD);

  for (const patient of DEMO_PATIENTS) {
    const email = normalizeEmail(patient.email);
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        fullName: patient.fullName,
        passwordHash,
        role: UserRole.PATIENT,
      },
      update: {
        fullName: patient.fullName,
        passwordHash,
        role: UserRole.PATIENT,
        isActive: true,
      },
    });

    await prisma.patient.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        cityId: kyivDistrictId
          ? (
              await prisma.district.findUnique({
                where: { id: kyivDistrictId },
                select: { cityId: true },
              })
            )?.cityId
          : undefined,
      },
      update: {},
    });
  }
}

async function seedSpecialistsFromCsv(
  rows: CsvRow[],
  districtKeyToId: Map<string, string>,
  specializationByName: Map<string, string>,
  injuryByName: Map<string, string>,
  formatByName: Map<string, string>,
): Promise<void> {
  const passwordHash = await hashPassword(DEMO_SPECIALIST_PASSWORD);

  for (const row of rows) {
    const email = specialistEmail(row.demoId);
    const districtId = districtKeyToId.get(`${row.city}::${row.district}`);
    const city = await prisma.city.findUnique({ where: { name: row.city } });

    if (!city || !districtId) {
      throw new Error(`Missing city/district for ${row.demoId}: ${row.city}/${row.district}`);
    }

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        fullName: row.fullName,
        passwordHash,
        role: UserRole.SPECIALIST,
      },
      update: {
        fullName: row.fullName,
        passwordHash,
        role: UserRole.SPECIALIST,
        isActive: true,
      },
    });

    const verifiedAt = row.verificationStatus === SpecialistStatus.APPROVED ? new Date() : null;

    const specialist = await prisma.specialist.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        cityId: city.id,
        districtId,
        experienceYears: row.experienceYears,
        pricePerSession: new Prisma.Decimal(row.pricePerSessionUah),
        description: row.description,
        inclusiveSpace: row.inclusiveSpace,
        verificationStatus: row.verificationStatus,
        verifiedAt,
        isDemo: row.isDemo,
        isVisible: true,
      },
      update: {
        cityId: city.id,
        districtId,
        experienceYears: row.experienceYears,
        pricePerSession: new Prisma.Decimal(row.pricePerSessionUah),
        description: row.description,
        inclusiveSpace: row.inclusiveSpace,
        verificationStatus: row.verificationStatus,
        verifiedAt,
        isDemo: row.isDemo,
        isVisible: true,
      },
    });

    const specializationId = specializationByName.get(row.specialization);
    const injuryTypeId = injuryByName.get(row.injuryType);
    const formatId = formatByName.get(row.appointmentFormat);

    if (!specializationId || !injuryTypeId || !formatId) {
      throw new Error(`Missing dictionary mapping for specialist ${row.demoId}`);
    }

    await prisma.specialistSpecialization.upsert({
      where: {
        specialistId_specializationId: {
          specialistId: specialist.id,
          specializationId,
        },
      },
      create: { specialistId: specialist.id, specializationId },
      update: {},
    });

    await prisma.specialistInjuryType.upsert({
      where: {
        specialistId_injuryTypeId: { specialistId: specialist.id, injuryTypeId },
      },
      create: { specialistId: specialist.id, injuryTypeId },
      update: {},
    });

    await prisma.specialistAppointmentFormat.upsert({
      where: {
        specialistId_formatId: { specialistId: specialist.id, formatId },
      },
      create: { specialistId: specialist.id, formatId },
      update: {},
    });

    const serviceName = "Базова консультація";
    const existingService = await prisma.service.findFirst({
      where: { specialistId: specialist.id, name: serviceName },
    });

    if (existingService) {
      await prisma.service.update({
        where: { id: existingService.id },
        data: {
          price: new Prisma.Decimal(row.pricePerSessionUah),
          description: "Демонстраційна послуга для навчального MVP",
          isActive: true,
        },
      });
    } else {
      await prisma.service.create({
        data: {
          specialistId: specialist.id,
          name: serviceName,
          description: "Демонстраційна послуга для навчального MVP",
          price: new Prisma.Decimal(row.pricePerSessionUah),
          isActive: true,
        },
      });
    }
  }
}

async function printCounts(): Promise<void> {
  const [
    cities,
    districts,
    specializations,
    injuryTypes,
    formats,
    criteria,
    users,
    specialists,
    patients,
    services,
  ] = await Promise.all([
    prisma.city.count(),
    prisma.district.count(),
    prisma.specialization.count(),
    prisma.injuryType.count(),
    prisma.appointmentFormat.count(),
    prisma.criterion.count(),
    prisma.user.count(),
    prisma.specialist.count(),
    prisma.patient.count(),
    prisma.service.count(),
  ]);

  console.log("Seed summary:", {
    cities,
    districts,
    specializations,
    injuryTypes,
    formats,
    criteria,
    users,
    specialists,
    patients,
    services,
  });
}

async function main(): Promise<void> {
  const csvPath = path.join(repoRoot, "fixtures", "specialists.csv");
  const csvContent = readFileSync(csvPath, "utf8");
  const rows = parseCsv(csvContent);

  if (rows.length !== 48) {
    throw new Error(`Expected 48 specialists in CSV, got ${rows.length}`);
  }

  const districtKeyToId = await seedCitiesAndDistricts();
  const dictionaries = await seedDictionaries();
  await seedAdmin();
  await seedPatients(districtKeyToId);
  await seedSpecialistsFromCsv(
    rows,
    districtKeyToId,
    dictionaries.specializationByName,
    dictionaries.injuryByName,
    dictionaries.formatByName,
    );

  await printCounts();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
