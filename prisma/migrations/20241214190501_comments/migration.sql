/*
  Warnings:

  - You are about to drop the column `isAnonymous` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Comment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "isAnonymous",
DROP COLUMN "userId",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT;
