/*
  Warnings:

  - You are about to drop the column `maxVotes` on the `PollConfig` table. All the data in the column will be lost.
  - You are about to drop the column `votesPerUser` on the `PollConfig` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pollId,optionId,userId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Vote_pollId_userId_key";

-- CreateTable
CREATE TABLE "PollAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollAccess_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PollAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PollGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollGroup_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PollGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PollConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollId" TEXT NOT NULL,
    "multipleChoice" BOOLEAN NOT NULL DEFAULT false,
    "maxVotesPerUser" INTEGER NOT NULL DEFAULT 1,
    "totalMaxVotes" INTEGER,
    "requireAuth" BOOLEAN NOT NULL DEFAULT true,
    "requireAccess" BOOLEAN NOT NULL DEFAULT false,
    "ipLimit" INTEGER NOT NULL DEFAULT 1,
    "captchaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "deadline" DATETIME,
    CONSTRAINT "PollConfig_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PollConfig" ("captchaEnabled", "deadline", "id", "ipLimit", "pollId", "requireAuth") SELECT "captchaEnabled", "deadline", "id", "ipLimit", "pollId", "requireAuth" FROM "PollConfig";
DROP TABLE "PollConfig";
ALTER TABLE "new_PollConfig" RENAME TO "PollConfig";
CREATE UNIQUE INDEX "PollConfig_pollId_key" ON "PollConfig"("pollId");
CREATE INDEX "PollConfig_pollId_idx" ON "PollConfig"("pollId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PollAccess_pollId_idx" ON "PollAccess"("pollId");

-- CreateIndex
CREATE INDEX "PollAccess_userId_idx" ON "PollAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PollAccess_pollId_userId_key" ON "PollAccess"("pollId", "userId");

-- CreateIndex
CREATE INDEX "PollGroup_pollId_idx" ON "PollGroup"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "PollGroup_pollId_name_key" ON "PollGroup"("pollId", "name");

-- CreateIndex
CREATE INDEX "GroupMembership_groupId_idx" ON "GroupMembership"("groupId");

-- CreateIndex
CREATE INDEX "GroupMembership_userId_idx" ON "GroupMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_groupId_userId_key" ON "GroupMembership"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_pollId_optionId_userId_key" ON "Vote"("pollId", "optionId", "userId");
