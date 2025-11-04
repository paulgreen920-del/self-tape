-- CreateTable
CREATE TABLE "Reader" (
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
    "ratePer30Min" INTEGER NOT NULL DEFAULT 2500,
    "unions" JSONB NOT NULL DEFAULT [],
    "languages" JSONB NOT NULL DEFAULT [],
    "specialties" JSONB NOT NULL DEFAULT [],
    "equipment" JSONB NOT NULL DEFAULT [],
    "links" JSONB NOT NULL DEFAULT [],
    "acceptsTerms" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "readerId" TEXT NOT NULL,
    CONSTRAINT "AvailabilitySlot_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Reader_email_key" ON "Reader"("email");

-- CreateIndex
CREATE INDEX "Reader_email_idx" ON "Reader"("email");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_readerId_dayOfWeek_idx" ON "AvailabilitySlot"("readerId", "dayOfWeek");
