import Container from "@/app/[locale]/(routes)/components/ui/Container";

import { BasicView } from "./components/BasicView";
import { FindSimilarButton } from "@/components/crm/find-similar-button";

import { getContact } from "@/actions/crm/get-contact";
import { getOpportunitiesFullByContactId } from "@/actions/crm/get-opportunities-with-includes-by-contactId";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getDocumentsByContactId } from "@/actions/documents/get-documents-by-contactId";
import { getAccountsByContactId } from "@/actions/crm/get-accounts-by-contactId";

import AccountsView from "../../components/AccountsView";
import OpportunitiesView from "../../components/OpportunitiesView";
import DocumentsView from "../../components/DocumentsView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryTab } from "./components/HistoryTab";
import { ActivitiesSection } from "./components/ActivitiesSection";

const ContactViewPage = async (props: any) => {
  const params = await props.params;
  const { contactId } = params;
  const contact: any = await getContact(contactId);
  const opportunities: any = await getOpportunitiesFullByContactId(contactId);
  const documents = await getDocumentsByContactId(contactId);
  const accounts = await getAccountsByContactId(contactId);
  const crmData = await getAllCrmData();

  //  console.log(accounts, "accounts");

  if (!contact) return <div>Contact not found</div>;

  return (
    <Container
      title={`Contact detail view: ${contact?.first_name} ${contact?.last_name}`}
      description={"Everything you need to know about sales potential"}
    >
      <Tabs defaultValue="overview">
        <TabsList className="h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="space-y-5">
            <BasicView data={contact} />
            <FindSimilarButton entityType="contact" recordId={contactId} />
          </div>
        </TabsContent>
        <TabsContent value="accounts">
            <AccountsView data={accounts} crmData={crmData} />
        </TabsContent>
        <TabsContent value="opportunities">
            <OpportunitiesView data={opportunities} crmData={crmData} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivitiesSection contactId={contact.id} />
        </TabsContent>
        <TabsContent value="documents">
            <DocumentsView data={documents} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab contactId={contactId} />
        </TabsContent>
      </Tabs>
    </Container>
  );
};

export default ContactViewPage;
