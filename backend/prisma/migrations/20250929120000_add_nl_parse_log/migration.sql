-- CreateTable
CREATE TABLE "nl_parse_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "parsedResult" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "userAccepted" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nl_parse_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "nl_parse_logs_confidence_score_range" CHECK ("confidenceScore" IS NULL OR ("confidenceScore" >= 0 AND "confidenceScore" <= 1))
);

-- CreateIndex
CREATE INDEX "nl_parse_logs_userId_idx" ON "nl_parse_logs"("userId");

-- CreateIndex
CREATE INDEX "nl_parse_logs_createdAt_idx" ON "nl_parse_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "nl_parse_logs" ADD CONSTRAINT "nl_parse_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
