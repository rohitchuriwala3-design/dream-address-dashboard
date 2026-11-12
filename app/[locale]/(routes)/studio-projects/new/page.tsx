import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStudioProjectOpportunities } from "@/actions/studio-projects/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewStudioProjectForm } from "./new-studio-project-form";

export default async function NewStudioProjectPage() {
  const opportunities = await getStudioProjectOpportunities();
  return <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-1 pb-8">
    <Button asChild variant="ghost" className="w-fit"><Link href="/studio-projects"><ArrowLeft className="mr-2 h-4 w-4"/>Back to projects</Link></Button>
    <div><p className="text-sm font-medium text-primary">Project setup</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Activate a studio project</h1><p className="mt-2 text-sm text-muted-foreground">Start from an active opportunity already linked to a client. Project value and dates are optional and remain blank until confirmed.</p></div>
    <Card><CardHeader><CardTitle>Project details</CardTitle></CardHeader><CardContent>
      {opportunities.length ? <NewStudioProjectForm opportunities={opportunities.map((opportunity) => ({id:opportunity.id,name:opportunity.name ?? "Untitled opportunity",accountName:opportunity.assigned_account?.name ?? "Client",currency:opportunity.currency ?? "INR",expectedRevenue:Number(opportunity.expected_revenue ?? 0)}))}/> : <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">There are no unlinked active opportunities visible to your account. Create or qualify a client opportunity first.<Button asChild variant="link" className="mt-2 block h-auto p-0"><Link href="/crm/opportunities">Open opportunities</Link></Button></div>}
    </CardContent></Card>
  </main>;
}
