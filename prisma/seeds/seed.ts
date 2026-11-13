import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// CRM Config seed data
import crmOpportunityTypeData from "../initial-data/crm_Opportunities_Type.json";
import crmOpportunitySaleStagesData from "../initial-data/crm_Opportunities_Sales_Stages.json";
import crmIndustryTypeData from "../initial-data/crm_Industry_Type.json";
import contactTypesData from "../initial-data/crm_Contact_Types.json";
import leadSourcesData from "../initial-data/crm_Lead_Sources.json";
import leadStatusesData from "../initial-data/crm_Lead_Statuses.json";
import leadTypesData from "../initial-data/crm_Lead_Types.json";

import { seedCurrencies } from "./currencies";
import { seedInvoices } from "./invoices";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

async function waitForDatabase() {
  const attempts = 10;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
      const isConnectionError =
        code === "ECONNREFUSED" ||
        code === "P1001" ||
        message.includes("ECONNREFUSED") ||
        message.includes("Can't reach database server");

      if (!isConnectionError || attempt === attempts) {
        throw error;
      }

      console.warn(`Database connection not ready (attempt ${attempt}/${attempts}); retrying in 2 seconds.`);
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
}

async function upsertByName(
  model: any,
  items: { name: string; [key: string]: any }[]
) {
  for (const item of items) {
    await model.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
  }
}

async function main() {
  console.log("-------- Seeding DB --------");
  await waitForDatabase();

  // CRM Opportunity Types (no unique on name — use findFirst + create/update)
  for (const item of crmOpportunityTypeData) {
    const existing = await prisma.crm_Opportunities_Type.findFirst({
      where: { name: item.name },
    });
    if (existing) {
      await prisma.crm_Opportunities_Type.update({
        where: { id: existing.id },
        data: { name: item.name, order: item.order, v: item.v },
      });
    } else {
      await prisma.crm_Opportunities_Type.create({
        data: { name: item.name, order: item.order, v: item.v },
      });
    }
  }
  console.log("Opportunity Types seeded");

  // CRM Opportunity Sales Stages (no unique on name — use findFirst + create/update)
  for (const item of crmOpportunitySaleStagesData) {
    const existing = await prisma.crm_Opportunities_Sales_Stages.findFirst({
      where: { name: item.name },
    });
    if (existing) {
      await prisma.crm_Opportunities_Sales_Stages.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          probability: item.probability,
          order: item.order,
          v: item.v,
        },
      });
    } else {
      await prisma.crm_Opportunities_Sales_Stages.create({
        data: {
          name: item.name,
          probability: item.probability,
          order: item.order,
          v: item.v,
        },
      });
    }
  }
  console.log("Opportunity Sales Stages seeded");

  // Connect automation kinds to the funnel stages (idempotent; matches by
  // name, skips stages an admin renamed — kinds are then set in admin UI).
  // The base seed's `crm_Opportunities_Sales_Stages.json` uses this repo's
  // legacy stage names rather than the funnel stage names, so the mapping
  // below only covers names whose automation intent is unambiguous; the
  // rest stay unmapped and are set via Admin -> Funnel settings.
  const stageKindByName: Record<string, string> = {
    "Pre-Sale": "pre_sale",
    "Qualified Lead": "qualified",
    "Purchase Order": "purchase_order",
    "Delivery": "delivery",
    "Care": "care",
    // Legacy demo-data stage names (see crm_Opportunities_Sales_Stages.json)
    "New": "pre_sale",
    "Need analysis": "qualified",
    "Signing": "purchase_order",
    "Realization of the project": "delivery",
  };
  for (const [name, kind] of Object.entries(stageKindByName)) {
    await prisma.crm_Opportunities_Sales_Stages.updateMany({
      where: { name, stage_kind: null },
      data: { stage_kind: kind },
    });
  }
  console.log("Sales stage kinds connected");

  // CRM Industry Types (no unique on name — use findFirst + create/update)
  for (const item of crmIndustryTypeData) {
    const existing = await prisma.crm_Industry_Type.findFirst({
      where: { name: item.name },
    });
    if (existing) {
      await prisma.crm_Industry_Type.update({
        where: { id: existing.id },
        data: { name: item.name, v: item.v },
      });
    } else {
      await prisma.crm_Industry_Type.create({
        data: { name: item.name, v: item.v },
      });
    }
  }
  console.log("Industry Types seeded");

  // CRM Contact Types (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Contact_Types, contactTypesData);
  console.log("Contact Types seeded");

  // CRM Lead Sources (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Lead_Sources, leadSourcesData);
  console.log("Lead Sources seeded");

  // CRM Lead Statuses (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Lead_Statuses, leadStatusesData);
  console.log("Lead Statuses seeded");

  // CRM Lead Types (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Lead_Types, leadTypesData);
  console.log("Lead Types seeded");

  let testUserId: string;
  if (process.env.NODE_ENV === "production") {
    const adminEmail = process.env.NEXUS360_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.NEXUS360_BOOTSTRAP_ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword || adminPassword.length < 12) {
      throw new Error("Production bootstrap admin email/password are missing or invalid.");
    }
    const adminName = process.env.NEXUS360_BOOTSTRAP_ADMIN_NAME || "Nexus 360 Admin";
    const adminUser = await prisma.users.upsert({
      where: { email: adminEmail },
      update: { name: adminName, userStatus: "ACTIVE", role: "admin", emailVerified: true },
      create: {
        email: adminEmail,
        name: adminName,
        userStatus: "ACTIVE",
        role: "admin",
        emailVerified: true,
      },
    });
    testUserId = adminUser.id;
    const credential = await prisma.account.findFirst({
      where: { userId: adminUser.id, providerId: "credential" },
      select: { id: true },
    });
    if (!credential) {
      await prisma.account.create({
        data: {
          accountId: adminUser.id,
          providerId: "credential",
          userId: adminUser.id,
          password: await hashPassword(adminPassword),
        },
      });
    }
    console.log(`Bootstrap admin ready: ${adminEmail}`);
  } else {
    // Test user for local and CI scenarios only. Production never gets a public
    // demo admin account; the Render bootstrap credentials create the owner.
    const testUserEmail = process.env.TEST_USER_EMAIL || "test@nextcrm.app";
    const testUser = await prisma.users.upsert({
      where: { email: testUserEmail },
      update: { name: "Admin", userStatus: "ACTIVE", role: "admin" },
      create: { email: testUserEmail, name: "Admin", userStatus: "ACTIVE", role: "admin" },
    });
    testUserId = testUser.id;
    const testCredential = await prisma.account.findFirst({
      where: { userId: testUser.id, providerId: "credential" },
      select: { id: true },
    });
    if (!testCredential) {
      await prisma.account.create({
        data: {
          accountId: testUser.id,
          providerId: "credential",
          userId: testUser.id,
          password: await hashPassword(process.env.TEST_USER_PASSWORD || "test-e2e-password-only"),
        },
      });
    }
    console.log(`Test user seeded: ${testUserEmail}`);
  }

  // Demo CRM dataset for e2e tests — the update/detail specs act on the
  // first table row and need at least one record per entity. Idempotent:
  // created only when missing (matched by name/email). Gated so a manual
  // `prisma db seed` against a real database doesn't inject demo records:
  // runs in CI (GitHub Actions sets CI=true) or with SEED_DEMO_DATA=1.
  const seedDemoData =
    process.env.CI === "true" || process.env.SEED_DEMO_DATA === "1";
  if (!seedDemoData) {
    console.log("Demo CRM dataset skipped (set SEED_DEMO_DATA=1 to include)");
  } else {
  let demoAccount = await prisma.crm_Accounts.findFirst({
    where: { name: "Seed Demo Account" },
  });
  if (!demoAccount) {
    demoAccount = await prisma.crm_Accounts.create({
      data: {
        v: 0,
        name: "Seed Demo Account",
        status: "Active",
        email: "demo-account@nextcrm.app",
        assigned_to: testUserId,
      },
    });
  }

  let demoContact = await prisma.crm_Contacts.findFirst({
    where: { last_name: "Demo Contact" },
  });
  if (!demoContact) {
    demoContact = await prisma.crm_Contacts.create({
      data: {
        first_name: "Seed",
        last_name: "Demo Contact",
        // Overridable so local calendar testing can direct invites to a real
        // inbox. Only takes effect on a database where this contact does not
        // yet exist (it is created, never updated) — i.e. after `pnpm db:reset`,
        // not on a re-run of `db:seed` against an existing row.
        email: process.env.SEED_CONTACT_EMAIL || "demo-contact@nextcrm.app",
        accountsIDs: demoAccount.id,
        assigned_to: testUserId,
      },
    });
  }

  const demoLead = await prisma.crm_Leads.findFirst({
    where: { lastName: "Demo Lead" },
  });
  if (!demoLead) {
    await prisma.crm_Leads.create({
      data: {
        firstName: "Seed",
        lastName: "Demo Lead",
        company: "Seed Demo Company",
        email: "demo-lead@nextcrm.app",
        assigned_to: testUserId,
      },
    });
  }

  const demoOpportunity = await prisma.crm_Opportunities.findFirst({
    where: { name: "Seed Demo Opportunity" },
  });
  if (!demoOpportunity) {
    const firstStage = await prisma.crm_Opportunities_Sales_Stages.findFirst({
      orderBy: { order: "asc" },
    });
    const firstType = await prisma.crm_Opportunities_Type.findFirst({
      orderBy: { order: "asc" },
    });
    await prisma.crm_Opportunities.create({
      data: {
        name: "Seed Demo Opportunity",
        account: demoAccount.id,
        contact: demoContact.id,
        sales_stage: firstStage?.id,
        type: firstType?.id,
        budget: 10000,
        expected_revenue: 8000,
        close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assigned_to: testUserId,
        createdBy: testUserId,
        updatedBy: testUserId,
      },
    });
  }

  const demoTarget = await prisma.crm_Targets.findFirst({
    where: { email: "demo-target@nextcrm.app" },
  });
  if (!demoTarget) {
    await prisma.crm_Targets.createMany({
      data: [
        {
          last_name: "Demo Target One",
          company: "Target Co One",
          email: "demo-target@nextcrm.app",
          created_by: testUserId,
        },
        {
          last_name: "Demo Target Two",
          company: "Target Co Two",
          email: "demo-target-2@nextcrm.app",
          created_by: testUserId,
        },
        {
          last_name: "Demo Target Three",
          company: "Target Co Three",
          email: "demo-target-3@nextcrm.app",
          created_by: testUserId,
        },
      ],
    });
  }
  console.log("Demo CRM dataset seeded");
  }

  // INR regional defaults
  await seedCurrencies(prisma);

  // Invoice module defaults
  await seedInvoices(prisma);

  console.log("-------- Seed DB completed --------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
