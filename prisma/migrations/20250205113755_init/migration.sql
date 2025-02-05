-- CreateTable
CREATE TABLE "SocialAccount" (
    "socialAccountId" TEXT NOT NULL,
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

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("socialAccountId")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_providerId_key" ON "SocialAccount"("providerId");

-- CreateIndex
CREATE INDEX "SocialAccount_provider_providerId_idx" ON "SocialAccount"("provider", "providerId");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
