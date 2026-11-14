import { getLead } from "@/actions/crm/get-lead";
import { getDocumentsByLeadId } from "@/actions/documents/get-documents-by-leadId";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import React from "react";
import { BasicView } from "./components/BasicView";
import { FindSimilarButton } from "@/components/crm/find-similar-button";
import DocumentsView from "../../components/DocumentsView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryTab } from "./components/HistoryTab";
import { ActivitiesSection } from "./components/ActivitiesSection";

interface LeadDetailPageProps {
  params: Promise<{
    leadId: string;
  }>;
}

const LeadDetailPage = async (props: LeadDetailPageProps) => {
  const params = await props.params;
  const { leadId } = params;
  const [lead, documents] = await Promise.all([
    getLead(leadId),
    getDocumentsByLeadId(leadId),
  ]);

  if (!lead) return <div>Lead not found</div>;

  return (
    <Container
      title={`Lead: ${lead?.firstName} ${lead?.lastName}`}
      description={"Everything you need to know about sales potential"}
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="space-y-5">
            <BasicView data={lead} />
            <DocumentsView data={documents} leadId={leadId} />
            <ActivitiesSection leadId={lead.id} />
            <FindSimilarButton entityType="lead" recordId={leadId} />
          </div>
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab leadId={leadId} />
        </TabsContent>
      </Tabs>
    </Container>
  );
};

export default LeadDetailPage;
