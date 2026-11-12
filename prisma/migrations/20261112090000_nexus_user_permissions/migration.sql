CREATE TABLE "NexusUserPermission" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NexusUserPermission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NexusUserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NexusUserPermission_userId_key_key" ON "NexusUserPermission"("userId", "key");
CREATE INDEX "NexusUserPermission_key_userId_idx" ON "NexusUserPermission"("key", "userId");
