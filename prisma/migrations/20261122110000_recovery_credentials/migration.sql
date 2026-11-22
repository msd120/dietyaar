CREATE TABLE "RecoveryCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastRotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecoveryCredential_userId_key" ON "RecoveryCredential"("userId");

ALTER TABLE "RecoveryCredential"
    ADD CONSTRAINT "RecoveryCredential_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
