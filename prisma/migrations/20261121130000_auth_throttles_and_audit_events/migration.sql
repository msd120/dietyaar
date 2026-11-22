CREATE TYPE "AuthThrottlePurpose" AS ENUM ('REGISTRATION', 'LOGIN', 'RECOVERY');

CREATE TABLE "AuthThrottle" (
    "purpose" "AuthThrottlePurpose" NOT NULL,
    "subjectHash" TEXT NOT NULL,
    "windowStarted" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("purpose", "subjectHash"),
    CONSTRAINT "AuthThrottle_attempts_check" CHECK ("attempts" >= 0)
);

CREATE TABLE "AuthAuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthThrottle_blockedUntil_idx" ON "AuthThrottle"("blockedUntil");
CREATE INDEX "AuthAuditEvent_userId_createdAt_idx" ON "AuthAuditEvent"("userId", "createdAt");
CREATE INDEX "AuthAuditEvent_event_createdAt_idx" ON "AuthAuditEvent"("event", "createdAt");
