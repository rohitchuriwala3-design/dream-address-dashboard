import { prismadb } from "@/lib/prisma";
import { withEffectiveStageOrder } from "@/lib/crm/stage-order";

export const getSaleStages = async () => {
  const data = await prismadb.crm_Opportunities_Sales_Stages.findMany({
    orderBy: [{ order: "asc" }, { probability: "asc" }, { name: "asc" }],
  });
  return withEffectiveStageOrder(data);
};
