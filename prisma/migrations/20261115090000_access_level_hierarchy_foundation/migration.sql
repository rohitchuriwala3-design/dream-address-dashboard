CREATE TYPE "NexusPermissionEffect" AS ENUM ('ALLOW', 'DENY');
CREATE TYPE "NexusRecordScope" AS ENUM ('OWN', 'ASSIGNED', 'REPORTING_TREE', 'TEAM', 'COMPANY');

CREATE TABLE "NexusAccessLevel" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(80) NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "rank" INTEGER NOT NULL DEFAULT 0,
  "parentId" UUID,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NexusAccessLevel_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NexusAccessLevel_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NexusAccessLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NexusAccessLevel_slug_key" ON "NexusAccessLevel"("slug");
CREATE INDEX "NexusAccessLevel_parentId_rank_idx" ON "NexusAccessLevel"("parentId", "rank");
CREATE INDEX "NexusAccessLevel_isActive_rank_idx" ON "NexusAccessLevel"("isActive", "rank");

CREATE TABLE "NexusAccessLevelPermission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "accessLevelId" UUID NOT NULL,
  "key" VARCHAR(100) NOT NULL,
  "effect" "NexusPermissionEffect" NOT NULL DEFAULT 'ALLOW',
  "scope" "NexusRecordScope" NOT NULL DEFAULT 'ASSIGNED',
  "inheritToChildren" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NexusAccessLevelPermission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NexusAccessLevelPermission_accessLevelId_fkey" FOREIGN KEY ("accessLevelId") REFERENCES "NexusAccessLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NexusAccessLevelPermission_accessLevelId_key_key" ON "NexusAccessLevelPermission"("accessLevelId", "key");
CREATE INDEX "NexusAccessLevelPermission_key_accessLevelId_idx" ON "NexusAccessLevelPermission"("key", "accessLevelId");

ALTER TABLE "Users"
  ADD COLUMN "accessLevelId" UUID,
  ADD COLUMN "reportsToId" UUID,
  ADD CONSTRAINT "Users_accessLevelId_fkey" FOREIGN KEY ("accessLevelId") REFERENCES "NexusAccessLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Users_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Users_accessLevelId_idx" ON "Users"("accessLevelId");
CREATE INDEX "Users_reportsToId_idx" ON "Users"("reportsToId");

ALTER TABLE "NexusUserPermission"
  ADD COLUMN "effect" "NexusPermissionEffect" NOT NULL DEFAULT 'ALLOW',
  ADD COLUMN "scope" "NexusRecordScope" NOT NULL DEFAULT 'ASSIGNED';

INSERT INTO "NexusAccessLevel" ("id", "name", "slug", "rank", "parentId", "isSystem", "updatedAt") VALUES
  ('10000000-0000-4000-8000-000000000001', 'Associate', 'associate', 10, NULL, true, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000002', 'Senior Associate', 'senior-associate', 20, '10000000-0000-4000-8000-000000000001', true, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000003', 'Manager', 'manager', 30, '10000000-0000-4000-8000-000000000002', true, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000004', 'Senior Manager', 'senior-manager', 40, '10000000-0000-4000-8000-000000000003', true, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000005', 'Founder', 'founder', 50, '10000000-0000-4000-8000-000000000004', true, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000006', 'Administrator', 'administrator', 60, '10000000-0000-4000-8000-000000000005', true, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000007', 'External Partner', 'external-partner', 0, NULL, true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "Users" AS u
SET "accessLevelId" = CASE u."role"::text
  WHEN 'admin' THEN '10000000-0000-4000-8000-000000000006'::uuid
  WHEN 'manager' THEN '10000000-0000-4000-8000-000000000003'::uuid
  WHEN 'partner' THEN '10000000-0000-4000-8000-000000000007'::uuid
  ELSE '10000000-0000-4000-8000-000000000001'::uuid
END
WHERE u."accessLevelId" IS NULL;
