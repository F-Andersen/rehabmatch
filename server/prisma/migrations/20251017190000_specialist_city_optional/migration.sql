-- Allow specialists to complete location during profile setup (M3).
ALTER TABLE "Specialist" ALTER COLUMN "cityId" DROP NOT NULL;
