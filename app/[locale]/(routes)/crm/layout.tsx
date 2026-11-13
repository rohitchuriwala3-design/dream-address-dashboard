import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSessionAnyStatus } from "@/lib/auth-server";
import { getUserPermissions } from "@/lib/authz";
import { canAccessCrm } from "@/lib/authz/crm-access";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionAnyStatus();
  const role = session?.user?.role;
  const permissions = role === "admin" || role === "partner" || !session?.user?.id
    ? []
    : await getUserPermissions(session.user.id);

  if (!canAccessCrm(role as Parameters<typeof canAccessCrm>[0], permissions)) {
    return (
      <main className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 py-10">
        <section className="w-full rounded-xl border bg-card p-6 shadow-sm" role="status">
          <p className="text-sm font-medium text-primary">Nexus 360 CRM</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">CRM access is not enabled for this profile</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ask a MARK IV administrator to grant the CRM view permission. Your account remains signed in, and no CRM records were opened.
          </p>
          <Button asChild className="mt-5" variant="outline">
            <Link href="/">Return to MARK IV</Link>
          </Button>
        </section>
      </main>
    );
  }

  return children;
}
