/*
  Warnings:

  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProjectToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ProjectToTag" DROP CONSTRAINT "_ProjectToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectToTag" DROP CONSTRAINT "_ProjectToTag_B_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "_ProjectToTag";
