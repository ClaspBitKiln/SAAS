-- AlterTable
ALTER TABLE "companies" ADD COLUMN "country" VARCHAR(2) NOT NULL DEFAULT 'RU';

-- AlterTable (widen tax id for KG 14 digits)
ALTER TABLE "companies" ALTER COLUMN "inn" TYPE VARCHAR(14);
