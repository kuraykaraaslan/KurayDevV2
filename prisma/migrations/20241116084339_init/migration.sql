/*
  Warnings:

  - You are about to drop the column `userSlug` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_userSlug_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "userSlug",
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");
