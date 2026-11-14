import Container from "@/app/[locale]/(routes)/components/ui/Container";
import React from "react";
import { BasicView } from "./components/BasicView";
import CaseStudyCard from "./components/CaseStudyCard";
import AccountPartnerCard from "./components/AccountPartnerCard";
import { getPartnerUsers } from "@/actions/crm/accounts/get-partner-users";
import { getSession } from "@/lib/auth-server";
import { requireAuthenticated, getUserPermissions, isManagerOrAdmin, AuthorizationError } from "@/lib/authz";
import { canSeeNavigationModule } from "@/lib/authz/navigation";
import { getAccountTabs, getAccountPanels } from "@/lib/plugins/slots";
import { PluginSlot } from "@/lib/plugins/ui/PluginSlot";
import { FindSimilarButton } from "@/components/crm/find-similar-button";

import { getAccount } from "@/actions/crm/get-account";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getOpportunitiesFullByAccountId } from "@/actions/crm/get-opportunities-with-includes-by-accountId";
import { getContactsByAccountId } from "@/actions/crm/get-contacts-by-accountId";
import { getLeadsByAccountId } from "@/actions/crm/get-leads-by-accountId";
import { getDocumentsByAccountId } from "@/actions/documents/get-documents-by-accountId";
import { getContractsByAccountId } from "@/actions/crm/get-contracts";
import { getAccountProducts } from "@/actions/crm/account-products/get-account-products";
import { getProductsFull } from "@/actions/crm/products/get-products";
import { serializeDecimalsList } from "@/lib/serialize-decimals";
import { getAccountsTasks } from "@/actions/crm/account/get-tasks";
import { getInvoicesByAccountId } from "@/actions/invoices/get-invoices-by-accountId";
import { getTranslations } from "next-intl/server";

import OpportunitiesView from "../../components/OpportunitiesView";
import LeadsView from "../../components/LeadsView";
import ContactsView from "../../components/ContactsView";
import DocumentsView from "../../components/DocumentsView";
import InvoicesView from "../../components/InvoicesView";

import {
  Documents,
  crm_Accounts,
  crm_Accounts_Tasks,
  crm_Contacts,
  crm_Contracts,
  crm_Leads,
  crm_Opportunities,
} from "@prisma/client";

import AccountsTasksView from "./components/TasksView";
import ContractsView from "../../components/ContractsView";
import AccountProductsView from "./components/AccountProductsView";
import { ActivitiesSection } from "./components/ActivitiesSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryTab } from "./components/HistoryTab";
import { AccountOrdersTab } from "./components/AccountOrdersTab";
import { listStudioProjectsByAccount, StudioProjectServiceError } from "@/actions/studio-projects/service";
import { StudioProjectPortfolio } from "./components/StudioProjectPortfolio";

interface AccountDetailPageProps {
  params: Promise<{
    accountId: string;
  }>;
}

const AccountDetailPage = async (props: AccountDetailPageProps) => {
  const params = await props.params;
  const { accountId } = params;
  const session = await getSession({ partner: true });
  const sessionUserRole = (session?.user as any)?.role ?? "user";
  const actorUser = await requireAuthenticated({ partner: true });
  const actor = { type: "user" as const, userId: actorUser.id, role: actorUser.role };
  const actorPermissions = actorUser.role === "admin" || actorUser.role === "partner"
    ? []
    : await getUserPermissions(actorUser.id);
  const canViewFinance = canSeeNavigationModule(actorUser.role, actorPermissions, "finance");
  const [pluginTabs, pluginPanels] = await Promise.all([getAccountTabs(actorUser.role), getAccountPanels(actorUser.role)]);
  const account: crm_Accounts | null = await getAccount(accountId);
  let studioProjects: Awaited<ReturnType<typeof listStudioProjectsByAccount>> | null = null;
  try {
    studioProjects = await listStudioProjectsByAccount(accountId);
  } catch (error) {
    if (!(error instanceof AuthorizationError) && !(error instanceof StudioProjectServiceError && error.code === "FORBIDDEN")) throw error;
  }
  const opportunities: crm_Opportunities[] = serializeDecimalsList(
    await getOpportunitiesFullByAccountId(accountId)
  );
  const contacts: crm_Contacts[] = await getContactsByAccountId(accountId);
  const contracts: crm_Contracts[] = serializeDecimalsList(
    await getContractsByAccountId(accountId)
  );
  const leads: crm_Leads[] = await getLeadsByAccountId(accountId);
  const documents: Documents[] = await getDocumentsByAccountId(accountId);
  const tasks: crm_Accounts_Tasks[] = await getAccountsTasks(accountId);
  // Keep CRM-only accounts usable without invoking a finance-protected query.
  const invoices = canViewFinance ? await getInvoicesByAccountId(accountId) : [];
  const t = await getTranslations("InvoicesPage");
  const to = await getTranslations("OrdersPage");
  const invoiceStatusLabels: Record<string, string> = {
    DRAFT: t("status.DRAFT"),
    ISSUED: t("status.ISSUED"),
    SENT: t("status.SENT"),
    PARTIALLY_PAID: t("status.PARTIALLY_PAID"),
    PAID: t("status.PAID"),
    OVERDUE: t("status.OVERDUE"),
    CANCELLED: t("status.CANCELLED"),
    DISPUTED: t("status.DISPUTED"),
    REFUNDED: t("status.REFUNDED"),
    WRITTEN_OFF: t("status.WRITTEN_OFF"),
  };
  const invoiceTableLabels = {
    number: t("table.number"),
    account: t("table.account"),
    issueDate: t("table.issueDate"),
    dueDate: t("table.dueDate"),
    total: t("table.total"),
    status: t("table.status"),
    type: t("table.type"),
    currency: t("table.currency"),
  };
  const crmData = await getAllCrmData();
  const accountProducts = serializeDecimalsList(
    await getAccountProducts(accountId)
  );
  const allProducts = await getProductsFull();
  const canSetPartner = isManagerOrAdmin(actorUser);
  const partners = canSetPartner ? await getPartnerUsers() : [];
  const activeProducts = allProducts
    .filter((p) => p.status === "ACTIVE")
    .map((p) => ({ id: p.id, name: p.name, currency: p.currency }));

  if (!account) return <div>Account not found</div>;

  return (
    <Container
      title={`Account: ${account?.name}`}
      description={"Everything you need to know about sales potential"}
    >
      <Tabs defaultValue="overview">
        <TabsList className="h-auto max-w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline ({opportunities.length + leads.length + contracts.length})</TabsTrigger>
          {studioProjects !== null && <TabsTrigger value="projects">Projects ({studioProjects.length})</TabsTrigger>}
          <TabsTrigger value="people">People ({contacts.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          {canViewFinance && <TabsTrigger value="finance">Finance ({invoices.length})</TabsTrigger>}
          <TabsTrigger value="activity">Activity & history</TabsTrigger>
          <TabsTrigger value="orders">{to("ordersTab")}</TabsTrigger>
          {await Promise.all(pluginTabs.map(async ({ plugin, tab }) => {
            const tp = await getTranslations(`plugins.${plugin.definition.id}` as never);
            return <TabsTrigger key={`${plugin.definition.id}:${tab.id}`} value={`plugin-${plugin.definition.id}-${tab.id}`}>{tp(tab.title as never)}</TabsTrigger>;
          }))}
        </TabsList>
        <TabsContent value="overview">
          <div className="space-y-5">
            <BasicView data={account} />
            {pluginPanels.map(({ plugin, panel }) => (
              <PluginSlot key={`${plugin.definition.id}:${panel.id}`} plugin={plugin} actor={actor} render={(ctx) => panel.component({ accountId: account.id, ctx })} />
            ))}
            <CaseStudyCard
              accountId={account.id}
              candidate={account.case_study_candidate}
              approved={account.case_study_approved}
              canApprove={
                sessionUserRole === "manager" || sessionUserRole === "admin"
              }
            />
            {canSetPartner && (
              <AccountPartnerCard
                accountId={account.id}
                partnerUserId={account.partnerUserId}
                partners={partners}
              />
            )}
            <FindSimilarButton entityType="account" recordId={accountId} />
          </div>
        </TabsContent>
        <TabsContent value="pipeline">
          <div className="space-y-5">
            <OpportunitiesView
              data={opportunities}
              crmData={crmData}
              accountId={accountId}
            />
            <ContractsView
              data={contracts}
              crmData={crmData}
              accountId={accountId}
            />
            <LeadsView data={leads} crmData={crmData} accountId={accountId} />
          </div>
        </TabsContent>
        {studioProjects !== null && <TabsContent value="projects">
          <StudioProjectPortfolio projects={studioProjects} />
        </TabsContent>}
        <TabsContent value="people">
          <div className="space-y-5">
            <ContactsView data={contacts} crmData={crmData} accountId={accountId} />
            <AccountsTasksView data={tasks} account={account} />
            <AccountProductsView
              data={accountProducts}
              accountId={accountId}
              crmData={crmData}
              activeProducts={activeProducts}
            />
          </div>
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsView data={documents} accountId={accountId} />
        </TabsContent>
        {canViewFinance && <TabsContent value="finance">
            <InvoicesView
              data={JSON.parse(JSON.stringify(invoices))}
              accountId={accountId}
              statusLabels={invoiceStatusLabels}
              tableLabels={invoiceTableLabels}
            />
        </TabsContent>}
        <TabsContent value="activity">
          <div className="space-y-5">
            <ActivitiesSection accountId={account.id} />
            <HistoryTab accountId={accountId} />
          </div>
        </TabsContent>
        <TabsContent value="orders">
          <AccountOrdersTab accountId={accountId} />
        </TabsContent>
        {pluginTabs.map(({ plugin, tab }) => (
          <TabsContent key={`${plugin.definition.id}:${tab.id}`} value={`plugin-${plugin.definition.id}-${tab.id}`}>
            <PluginSlot plugin={plugin} actor={actor} render={(ctx) => tab.component({ accountId, ctx })} />
          </TabsContent>
        ))}
      </Tabs>
    </Container>
  );
};

export default AccountDetailPage;
