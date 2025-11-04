/*
  Warnings:

  - You are about to drop the column `equipment` on the `Reader` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "headshotUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "city" TEXT,
    "bio" TEXT,
    "ratePer15Min" INTEGER NOT NULL DEFAULT 1500,
    "ratePer30Min" INTEGER NOT NULL DEFAULT 2500,
    "ratePer60Min" INTEGER NOT NULL DEFAULT 6000,
    "unions" JSONB NOT NULL DEFAULT [],
    "languages" JSONB NOT NULL DEFAULT [],
    "specialties" JSONB NOT NULL DEFAULT [],
    "links" JSONB NOT NULL DEFAULT [],
    "acceptsTerms" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Reader" ("acceptsTerms", "bio", "city", "createdAt", "displayName", "email", "headshotUrl", "id", "isActive", "languages", "links", "marketingOptIn", "phone", "ratePer30Min", "specialties", "timezone", "unions", "updatedAt") SELECT "acceptsTerms", "bio", "city", "createdAt", "displayName", "email", "headshotUrl", "id", "isActive", "languages", "links", "marketingOptIn", "phone", "ratePer30Min", "specialties", "timezone", "unions", "updatedAt" FROM "Reader";
DROP TABLE "Reader";
ALTER TABLE "new_Reader" RENAME TO "Reader";
CREATE UNIQUE INDEX "Reader_email_key" ON "Reader"("email");
CREATE INDEX "Reader_email_idx" ON "Reader"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
