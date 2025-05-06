/*
  Warnings:

  - You are about to drop the column `adressCity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `adressCountry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `adressLine1` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `adressLine2` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `adressState` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `adressZip` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SocialAccount` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OTPMethod" AS ENUM ('EMAIL', 'SMS', 'TOTP_APP', 'PUSH_APP');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "SocialAccount" DROP CONSTRAINT "SocialAccount_userId_fkey";

-- DropIndex
DROP INDEX "User_slug_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "adressCity",
DROP COLUMN "adressCountry",
DROP COLUMN "adressLine1",
DROP COLUMN "adressLine2",
DROP COLUMN "adressState",
DROP COLUMN "adressZip",
DROP COLUMN "coverImage",
DROP COLUMN "emailVerificationToken",
DROP COLUMN "emailVerified",
DROP COLUMN "image",
DROP COLUMN "passwordResetToken",
DROP COLUMN "phoneVerificationToken",
DROP COLUMN "phoneVerified",
DROP COLUMN "role",
DROP COLUMN "slug",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "otpMethods" "OTPMethod"[] DEFAULT ARRAY[]::"OTPMethod"[],
ADD COLUMN     "otpSecret" TEXT,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "userNationalityCountry" TEXT,
ADD COLUMN     "userNationalityId" TEXT,
ADD COLUMN     "userRole" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "userStatus" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "password" SET NOT NULL;

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "SocialAccount";

-- CreateTable
CREATE TABLE "UserSession" (
    "userSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "sessionExpiry" TIMESTAMP(3) NOT NULL,
    "otpVerifyNeeded" BOOLEAN NOT NULL DEFAULT false,
    "otpVerifiedAt" TIMESTAMP(3),
    "ip" TEXT,
    "os" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "deviceFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("userSessionId")
);

-- CreateTable
CREATE TABLE "UserSocialAccount" (
    "userSocialAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "profilePicture" TEXT,
    "profileUrl" TEXT,
    "scopes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSocialAccount_pkey" PRIMARY KEY ("userSocialAccountId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_accessToken_key" ON "UserSession"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refreshToken_key" ON "UserSession"("refreshToken");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSocialAccount_providerId_key" ON "UserSocialAccount"("providerId");

-- CreateIndex
CREATE INDEX "UserSocialAccount_provider_providerId_idx" ON "UserSocialAccount"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSocialAccount" ADD CONSTRAINT "UserSocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
