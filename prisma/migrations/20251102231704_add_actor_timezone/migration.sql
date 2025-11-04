-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "actorTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "readerId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "meetingUrl" TEXT,
    "notes" TEXT,
    CONSTRAINT "Booking_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("actorEmail", "actorName", "createdAt", "durationMin", "endTime", "id", "meetingUrl", "notes", "priceCents", "readerId", "startTime", "status", "updatedAt") SELECT "actorEmail", "actorName", "createdAt", "durationMin", "endTime", "id", "meetingUrl", "notes", "priceCents", "readerId", "startTime", "status", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_readerId_startTime_idx" ON "Booking"("readerId", "startTime");
CREATE INDEX "Booking_actorEmail_idx" ON "Booking"("actorEmail");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
