jest.mock("@/lib/authz", () => ({
  requireRole: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    crm_Opportunities_Sales_Stages: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { requireRole } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { createConfigValue, getConfigValues, updateConfigValue } from "../crm-settings";

const adminCheck = requireRole as jest.Mock;
const stages = prismadb.crm_Opportunities_Sales_Stages as unknown as {
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  adminCheck.mockResolvedValue(undefined);
});

it("returns sales stages with their editable order and forecast probability", async () => {
  stages.findMany.mockResolvedValue([{
    id: "stage-1", name: "Survey", order: 20, probability: 35, stage_kind: "pre_sale",
    _count: { assigned_opportunities_sales_stage: 2 },
  }]);

  await expect(getConfigValues("salesStage")).resolves.toEqual([{
    id: "stage-1", name: "Survey", usageCount: 2, stageKind: "pre_sale", stageOrder: 20, probability: 35,
  }]);
  expect(stages.findMany).toHaveBeenCalledWith(expect.objectContaining({
    orderBy: [{ order: "asc" }, { probability: "asc" }, { name: "asc" }],
  }));
});

it("persists configured order and probability for added and edited stages", async () => {
  stages.create.mockResolvedValue({});
  stages.update.mockResolvedValue({});

  await createConfigValue("salesStage", "Survey", "pre_sale", 15, 40);
  await updateConfigValue("salesStage", "stage-1", "Survey & brief", "qualified", 25, 55);

  expect(stages.create).toHaveBeenCalledWith({ data: {
    name: "Survey", v: 0, stage_kind: "pre_sale", order: 15, probability: 40,
  } });
  expect(stages.update).toHaveBeenCalledWith({ where: { id: "stage-1" }, data: {
    name: "Survey & brief", stage_kind: "qualified", order: 25, probability: 55,
  } });
});

it("rejects forecast probabilities outside 0–100", async () => {
  await expect(updateConfigValue("salesStage", "stage-1", "Survey", null, 10, 101)).rejects.toThrow();
  expect(stages.update).not.toHaveBeenCalled();
});
