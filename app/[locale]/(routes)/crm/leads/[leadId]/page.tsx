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
      title={[lead.firstName, lead.lastName].filter(Boolean).join(" ")}
      description={`${lead.company || "Residential enquiry"} · ${lead.convertedAt ? "Client account" : "Pre-closure lead"}`}
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
            <div className="min-w-0 space-y-4">
              <BasicView data={lead} />
              <FindSimilarButton entityType="lead" recordId={leadId} />
            </div>
            <aside className="min-w-0 space-y-4" aria-label="Follow-ups and files">
              <ActivitiesSection leadId={lead.id} />
              <DocumentsView data={documents} leadId={leadId} />
            </aside>
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
