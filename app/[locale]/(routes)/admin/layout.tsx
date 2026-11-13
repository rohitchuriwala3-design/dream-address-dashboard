import { redirect } from "next/navigation";
import { requireRole, AuthorizationError, AuthenticationError } from "@/lib/authz";
import { AdminSidebarNav } from "./_components/AdminSidebarNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(["admin"]);
  } catch (e) {
    if (e instanceof AuthenticationError) redirect("/sign-in");
    if (e instanceof AuthorizationError) redirect("/");
    throw e;
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col lg:flex-row">
      <aside className="hidden w-56 shrink-0 border-r bg-card px-2 py-4 lg:flex lg:flex-col">
        <AdminSidebarNav />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b bg-card px-3 py-2 lg:hidden">
          <AdminSidebarNav orientation="horizontal" />
        </div>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
