-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanSessionId" TEXT NOT NULL,
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
CREATE TABLE "new_RawPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanSessionId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "postText" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "facebookUrl" TEXT,
    "userName" TEXT,
    "userId" TEXT,
    "rawJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RawPost_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "ScanSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RawPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RawPost" ("createdAt", "facebookUrl", "groupId", "id", "postText", "postUrl", "rawJson", "scanSessionId", "userId", "userName") SELECT "createdAt", "facebookUrl", "groupId", "id", "postText", "postUrl", "rawJson", "scanSessionId", "userId", "userName" FROM "RawPost";
DROP TABLE "RawPost";
ALTER TABLE "new_RawPost" RENAME TO "RawPost";
CREATE TABLE "new_ScanGroupResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanSessionId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "postsFound" INTEGER NOT NULL DEFAULT 0,
    "leadsFound" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScanGroupResult_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "ScanSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScanGroupResult_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScanGroupResult" ("createdAt", "errorMessage", "groupId", "id", "leadsFound", "postsFound", "scanSessionId", "status") SELECT "createdAt", "errorMessage", "groupId", "id", "leadsFound", "postsFound", "scanSessionId", "status" FROM "ScanGroupResult";
DROP TABLE "ScanGroupResult";
ALTER TABLE "new_ScanGroupResult" RENAME TO "ScanGroupResult";
CREATE TABLE "new_SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "sheetRow" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SyncLog" ("createdAt", "errorMessage", "id", "leadId", "sheetRow", "status") SELECT "createdAt", "errorMessage", "id", "leadId", "sheetRow", "status" FROM "SyncLog";
DROP TABLE "SyncLog";
ALTER TABLE "new_SyncLog" RENAME TO "SyncLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
