-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366F1',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "jobId" TEXT,
    "lastScannedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Group_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("createdAt", "enabled", "id", "lastScannedAt", "name", "priority", "updatedAt", "url") SELECT "createdAt", "enabled", "id", "lastScannedAt", "name", "priority", "updatedAt", "url" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_url_key" ON "Group"("url");
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanSessionId" TEXT NOT NULL,
    "jobId" TEXT,
    "rawPostId" TEXT NOT NULL,
    "userName" TEXT,
    "userProfileUrl" TEXT,
    "postUrl" TEXT,
    "postText" TEXT NOT NULL,
    "hinhThucCast" TEXT,
    "sanPhamDichVu" TEXT,
    "soLuongCanBook" TEXT,
    "sdtLienHe" TEXT,
    "message" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0,
    "reason" TEXT,
    "rejectReason" TEXT,
    "fingerprint" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RAW',
    "syncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "ScanSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lead_rawPostId_fkey" FOREIGN KEY ("rawPostId") REFERENCES "RawPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("confidence", "createdAt", "fingerprint", "hinhThucCast", "id", "message", "postText", "postUrl", "rawPostId", "reason", "rejectReason", "sanPhamDichVu", "scanSessionId", "sdtLienHe", "soLuongCanBook", "status", "syncedAt", "updatedAt", "userName", "userProfileUrl") SELECT "confidence", "createdAt", "fingerprint", "hinhThucCast", "id", "message", "postText", "postUrl", "rawPostId", "reason", "rejectReason", "sanPhamDichVu", "scanSessionId", "sdtLienHe", "soLuongCanBook", "status", "syncedAt", "updatedAt", "userName", "userProfileUrl" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE UNIQUE INDEX "Lead_rawPostId_key" ON "Lead"("rawPostId");
CREATE INDEX "Lead_fingerprint_idx" ON "Lead"("fingerprint");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_scanSessionId_status_idx" ON "Lead"("scanSessionId", "status");
CREATE TABLE "new_ScanSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "jobId" TEXT,
    "scanDays" INTEGER NOT NULL DEFAULT 2,
    "resultLimit" INTEGER NOT NULL DEFAULT 30,
    "totalGroups" INTEGER NOT NULL DEFAULT 0,
    "successGroups" INTEGER NOT NULL DEFAULT 0,
    "failedGroups" INTEGER NOT NULL DEFAULT 0,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "totalDuplicated" INTEGER NOT NULL DEFAULT 0,
    "totalRejected" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    CONSTRAINT "ScanSession_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ScanSession" ("endedAt", "errorMessage", "failedGroups", "id", "resultLimit", "scanDays", "startedAt", "status", "successGroups", "totalDuplicated", "totalGroups", "totalLeads", "totalPosts", "totalRejected") SELECT "endedAt", "errorMessage", "failedGroups", "id", "resultLimit", "scanDays", "startedAt", "status", "successGroups", "totalDuplicated", "totalGroups", "totalLeads", "totalPosts", "totalRejected" FROM "ScanSession";
DROP TABLE "ScanSession";
ALTER TABLE "new_ScanSession" RENAME TO "ScanSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
