-- CreateTable
CREATE TABLE "lifelog_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" VARCHAR(280) NOT NULL,
    "tags" TEXT[],
    "mood" TEXT,
    "images" TEXT[],
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "locationName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifelog_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "category" VARCHAR(50) DEFAULT 'general',
    "color" VARCHAR(7) DEFAULT '#1976D2',
    "location" VARCHAR(255),
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lifelog_entries_userId_idx" ON "lifelog_entries"("userId");

-- CreateIndex
CREATE INDEX "lifelog_entries_createdAt_idx" ON "lifelog_entries"("createdAt");

-- CreateIndex
CREATE INDEX "calendar_events_userId_idx" ON "calendar_events"("userId");

-- CreateIndex
CREATE INDEX "calendar_events_startTime_endTime_idx" ON "calendar_events"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "calendar_events_category_idx" ON "calendar_events"("category");

-- AddForeignKey
ALTER TABLE "lifelog_entries" ADD CONSTRAINT "lifelog_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
