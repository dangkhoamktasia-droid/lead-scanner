-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScanSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "scanDays" INTEGER NOT NULL DEFAULT 2,
    "resultLimit" INTEGER NOT NULL DEFAULT 30,
    "totalGroups" INTEGER NOT NULL DEFAULT 0,
    "successGroups" INTEGER NOT NULL DEFAULT 0,
    "failedGroups" INTEGER NOT NULL DEFAULT 0,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "totalDuplicated" INTEGER NOT NULL DEFAULT 0,
    "totalRejected" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT
);

-- CreateTable
CREATE TABLE "ScanGroupResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanSessionId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "postsFound" INTEGER NOT NULL DEFAULT 0,
    "leadsFound" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScanGroupResult_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "ScanSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScanGroupResult_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RawPost" (
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
    CONSTRAINT "RawPost_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "ScanSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RawPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
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
    CONSTRAINT "Lead_scanSessionId_fkey" FOREIGN KEY ("scanSessionId") REFERENCES "ScanSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lead_rawPostId_fkey" FOREIGN KEY ("rawPostId") REFERENCES "RawPost" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "sheetRow" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_url_key" ON "Group"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_rawPostId_key" ON "Lead"("rawPostId");
