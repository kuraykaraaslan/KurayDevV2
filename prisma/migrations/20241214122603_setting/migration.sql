-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "group" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'string';
