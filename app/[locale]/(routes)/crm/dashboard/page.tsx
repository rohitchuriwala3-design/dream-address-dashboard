import React from "react";
import Container from "../../components/ui/Container";
import { getSaleStages } from "@/actions/crm/get-sales-stage";
import CRMKanban from "./_components/CRMKanban";
import { getOpportunities } from "@/actions/crm/get-opportunities";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { serializeDecimalsList } from "@/lib/serialize-decimals";
import { getSession } from "@/lib/auth-server";

const CrmDashboardPage = async () => {
  const [session, salesStages, opportunities, crmData] = await Promise.all([
    getSession({ partner: true }),
    getSaleStages(),
    getOpportunities().then(serializeDecimalsList),
    getAllCrmData(),
  ]);

  return (
    <Container
      title="CRM Dashboard"
      description="Track active opportunities by stage, then review closed wins and losses."
    >
      <div className="w-full h-full  overflow-hidden">
        <CRMKanban
          key={session?.user.id ?? "anonymous"}
          userId={session?.user.id ?? "anonymous"}
          salesStages={salesStages}
          opportunities={opportunities}
          crmData={crmData}
        />
      </div>

      {/*     <CRMKanbanServer
        salesStages={salesStages}
        opportunities={opportunities}
      /> */}
    </Container>
  );
};

export default CrmDashboardPage;
