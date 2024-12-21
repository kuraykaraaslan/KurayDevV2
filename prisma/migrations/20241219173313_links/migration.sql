/*
  Warnings:

  - You are about to drop the column `appstoreLink` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `demoLink` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `downloadLink` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `githubLink` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `playstoreLink` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `websiteLink` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "appstoreLink",
DROP COLUMN "demoLink",
DROP COLUMN "downloadLink",
DROP COLUMN "githubLink",
DROP COLUMN "playstoreLink",
DROP COLUMN "websiteLink";

-- CreateTable
CREATE TABLE "ProjectLink" (
    "linkId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectLink_pkey" PRIMARY KEY ("linkId")
);

-- AddForeignKey
ALTER TABLE "ProjectLink" ADD CONSTRAINT "ProjectLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
