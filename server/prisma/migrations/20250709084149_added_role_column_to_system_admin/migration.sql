-- AlterTable
ALTER TABLE "SystemAdmin" ADD COLUMN     "role" TEXT[] DEFAULT ARRAY['Admin']::TEXT[];
