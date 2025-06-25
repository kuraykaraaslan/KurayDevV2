/*
  Warnings:

  - You are about to drop the column `workDayCode` on the `Appointment` table. All the data in the column will be lost.
  - The primary key for the `WorkDay` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `WorkDay` table. All the data in the column will be lost.
  - You are about to drop the column `divideMinutes` on the `WorkDay` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `WorkDay` table. All the data in the column will be lost.
  - You are about to drop the column `workDayCode` on the `WorkDay` table. All the data in the column will be lost.
  - Added the required column `workDayId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodDuration` to the `WorkDay` table without a default value. This is not possible if the table is not empty.
  - The required column `workDayId` was added to the `WorkDay` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_workDayCode_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "workDayCode",
ADD COLUMN     "workDayId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkDay" DROP CONSTRAINT "WorkDay_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "divideMinutes",
DROP COLUMN "updatedAt",
DROP COLUMN "workDayCode",
ADD COLUMN     "periodDuration" INTEGER NOT NULL,
ADD COLUMN     "workDayId" TEXT NOT NULL,
ADD CONSTRAINT "WorkDay_pkey" PRIMARY KEY ("workDayId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_workDayId_fkey" FOREIGN KEY ("workDayId") REFERENCES "WorkDay"("workDayId") ON DELETE CASCADE ON UPDATE CASCADE;
