-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'SPECIALIST', 'ADMIN');

-- CreateEnum
CREATE TYPE "SpecialistStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CriterionKey" AS ENUM ('EXPERIENCE', 'PRICE', 'RATING', 'LOCATION', 'FORMAT');

-- CreateEnum
CREATE TYPE "CriterionType" AS ENUM ('BENEFIT', 'COST', 'MATCH');

-- CreateEnum
CREATE TYPE "PreferenceMode" AS ENUM ('AHP_PAIRWISE', 'DIRECT_WSM');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AppointmentRequestStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cityId" UUID,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialist" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "districtId" UUID,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "pricePerSession" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT,
    "inclusiveSpace" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "SpecialistStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "ratingAvg" DOUBLE PRECISION,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialistSpecialization" (
    "specialistId" UUID NOT NULL,
    "specializationId" UUID NOT NULL,

    CONSTRAINT "SpecialistSpecialization_pkey" PRIMARY KEY ("specialistId","specializationId")
);

-- CreateTable
CREATE TABLE "City" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InjuryType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "InjuryType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialistInjuryType" (
    "specialistId" UUID NOT NULL,
    "injuryTypeId" UUID NOT NULL,

    CONSTRAINT "SpecialistInjuryType_pkey" PRIMARY KEY ("specialistId","injuryTypeId")
);

-- CreateTable
CREATE TABLE "AppointmentFormat" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AppointmentFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialistAppointmentFormat" (
    "specialistId" UUID NOT NULL,
    "formatId" UUID NOT NULL,

    CONSTRAINT "SpecialistAppointmentFormat_pkey" PRIMARY KEY ("specialistId","formatId")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "specialistId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchRequest" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "injuryTypeId" UUID NOT NULL,
    "cityId" UUID,
    "districtId" UUID,
    "formatId" UUID,
    "maxBudget" DECIMAL(10,2) NOT NULL,
    "cityOnly" BOOLEAN NOT NULL DEFAULT false,
    "inclusiveOnly" BOOLEAN NOT NULL DEFAULT false,
    "radiusKm" DOUBLE PRECISION,
    "preferenceMode" "PreferenceMode" NOT NULL,
    "consistencyRatio" DOUBLE PRECISION,
    "filtersSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" UUID NOT NULL,
    "key" "CriterionKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criterionType" "CriterionType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionPriority" (
    "id" UUID NOT NULL,
    "searchRequestId" UUID NOT NULL,
    "criterionId" UUID NOT NULL,
    "rawValue" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CriterionPriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionComparison" (
    "id" UUID NOT NULL,
    "searchRequestId" UUID NOT NULL,
    "criterionAId" UUID NOT NULL,
    "criterionBId" UUID NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CriterionComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" UUID NOT NULL,
    "searchRequestId" UUID NOT NULL,
    "method" "PreferenceMode" NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'COMPLETE',
    "weightsSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationItem" (
    "id" UUID NOT NULL,
    "recommendationId" UUID NOT NULL,
    "specialistId" UUID NOT NULL,
    "rankPosition" INTEGER NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "explanation" JSONB NOT NULL,

    CONSTRAINT "RecommendationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "specialistId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRequest" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "specialistId" UUID NOT NULL,
    "preferredAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Specialist_userId_key" ON "Specialist"("userId");

-- CreateIndex
CREATE INDEX "Specialist_verificationStatus_isVisible_idx" ON "Specialist"("verificationStatus", "isVisible");

-- CreateIndex
CREATE INDEX "Specialist_cityId_pricePerSession_idx" ON "Specialist"("cityId", "pricePerSession");

-- CreateIndex
CREATE INDEX "Specialist_experienceYears_idx" ON "Specialist"("experienceYears");

-- CreateIndex
CREATE UNIQUE INDEX "Specialization_name_key" ON "Specialization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "District_cityId_name_key" ON "District"("cityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InjuryType_name_key" ON "InjuryType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentFormat_name_key" ON "AppointmentFormat"("name");

-- CreateIndex
CREATE INDEX "Service_specialistId_idx" ON "Service"("specialistId");

-- CreateIndex
CREATE INDEX "SearchRequest_patientId_createdAt_idx" ON "SearchRequest"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Criterion_key_key" ON "Criterion"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionPriority_searchRequestId_criterionId_key" ON "CriterionPriority"("searchRequestId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionComparison_searchRequestId_criterionAId_criterionB_key" ON "CriterionComparison"("searchRequestId", "criterionAId", "criterionBId");

-- CreateIndex
CREATE INDEX "Recommendation_searchRequestId_createdAt_idx" ON "Recommendation"("searchRequestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationItem_recommendationId_specialistId_key" ON "RecommendationItem"("recommendationId", "specialistId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationItem_recommendationId_rankPosition_key" ON "RecommendationItem"("recommendationId", "rankPosition");

-- CreateIndex
CREATE INDEX "Review_specialistId_status_idx" ON "Review"("specialistId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_patientId_specialistId_key" ON "Review"("patientId", "specialistId");

-- CreateIndex
CREATE INDEX "AppointmentRequest_specialistId_status_idx" ON "AppointmentRequest"("specialistId", "status");

-- CreateIndex
CREATE INDEX "AppointmentRequest_patientId_createdAt_idx" ON "AppointmentRequest"("patientId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialist" ADD CONSTRAINT "Specialist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialist" ADD CONSTRAINT "Specialist_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialist" ADD CONSTRAINT "Specialist_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistSpecialization" ADD CONSTRAINT "SpecialistSpecialization_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistSpecialization" ADD CONSTRAINT "SpecialistSpecialization_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "Specialization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistInjuryType" ADD CONSTRAINT "SpecialistInjuryType_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistInjuryType" ADD CONSTRAINT "SpecialistInjuryType_injuryTypeId_fkey" FOREIGN KEY ("injuryTypeId") REFERENCES "InjuryType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistAppointmentFormat" ADD CONSTRAINT "SpecialistAppointmentFormat_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialistAppointmentFormat" ADD CONSTRAINT "SpecialistAppointmentFormat_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "AppointmentFormat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchRequest" ADD CONSTRAINT "SearchRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchRequest" ADD CONSTRAINT "SearchRequest_injuryTypeId_fkey" FOREIGN KEY ("injuryTypeId") REFERENCES "InjuryType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchRequest" ADD CONSTRAINT "SearchRequest_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchRequest" ADD CONSTRAINT "SearchRequest_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchRequest" ADD CONSTRAINT "SearchRequest_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "AppointmentFormat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionPriority" ADD CONSTRAINT "CriterionPriority_searchRequestId_fkey" FOREIGN KEY ("searchRequestId") REFERENCES "SearchRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionPriority" ADD CONSTRAINT "CriterionPriority_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionComparison" ADD CONSTRAINT "CriterionComparison_searchRequestId_fkey" FOREIGN KEY ("searchRequestId") REFERENCES "SearchRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionComparison" ADD CONSTRAINT "CriterionComparison_criterionAId_fkey" FOREIGN KEY ("criterionAId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionComparison" ADD CONSTRAINT "CriterionComparison_criterionBId_fkey" FOREIGN KEY ("criterionBId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_searchRequestId_fkey" FOREIGN KEY ("searchRequestId") REFERENCES "SearchRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationItem" ADD CONSTRAINT "RecommendationItem_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationItem" ADD CONSTRAINT "RecommendationItem_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

