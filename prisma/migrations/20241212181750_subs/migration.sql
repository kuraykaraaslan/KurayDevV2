/*
  Warnings:

  - The primary key for the `Subscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `subscriptionId` on the `Subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_pkey",
DROP COLUMN "subscriptionId",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY ("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_email_key" ON "Subscription"("email");
