/*
  Warnings:

  - The primary key for the `WorkDay` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `endTime` on the `WorkDay` table. All the data in the column will be lost.
  - You are about to drop the column `periodDuration` on the `WorkDay` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `WorkDay` table. All the data in the column will be lost.
  - You are about to drop the column `workDayId` on the `WorkDay` table. All the data in the column will be lost.
  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[date]` on the table `WorkDay` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `WorkDay` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('available', 'booked', 'unavailable');

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_workDayId_fkey";

-- AlterTable
ALTER TABLE "WorkDay" DROP CONSTRAINT "WorkDay_pkey",
DROP COLUMN "endTime",
DROP COLUMN "periodDuration",
DROP COLUMN "startTime",
DROP COLUMN "workDayId",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "WorkDay_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Appointment";

-- CreateTable
CREATE TABLE "Slot" (
    "id" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "status" "SlotStatus" NOT NULL,
    "workDayId" INTEGER NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkDay_date_key" ON "WorkDay"("date");

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_workDayId_fkey" FOREIGN KEY ("workDayId") REFERENCES "WorkDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
