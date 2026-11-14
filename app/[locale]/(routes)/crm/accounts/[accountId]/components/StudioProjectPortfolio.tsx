import Link from "next/link";
import { ArrowUpRight, CalendarDays, FolderKanban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PortfolioProject = {
  id: string;
  code: string;
  name: string;
  status: string;
  currency: string;
  contractValue: unknown;
  startDate: Date | string | null;
  targetHandoverDate: Date | string | null;
  actualHandoverDate: Date | string | null;
  opportunity: { id: string; name: string | null } | null;
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export function StudioProjectPortfolio({ projects }: { projects: PortfolioProject[] }) {
  const activeCount = projects.filter((project) => !["COMPLETED", "CANCELLED"].includes(project.status)).length;
  return (
    <Card>
      <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><FolderKanban className="h-5 w-5" />Studio project portfolio</CardTitle>
          <CardDescription>Separate jobs for this continuing client account, including concurrent work.</CardDescription>
        </div>
        <Badge variant="secondary">{activeCount} active · {projects.length} total</Badge>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No studio projects are linked to this client yet. A confirmed Opportunity can be activated as its own project.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((project) => {
              const value = project.currency === "INR" && project.contractValue !== null
                ? inr.format(Number(project.contractValue))
                : "Value needs an INR review";
              const handover = project.actualHandoverDate ?? project.targetHandoverDate;
              return (
                <Link key={project.id} href={`/studio-projects/${project.id}`} className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-mono text-xs text-muted-foreground">{project.code}</p><h3 className="mt-1 truncate font-semibold">{project.name}</h3></div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2"><Badge variant="outline">{project.status.replaceAll("_", " ")}</Badge><span className="text-sm font-medium tabular-nums">{value}</span></div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{project.opportunity?.name ? `Opportunity: ${project.opportunity.name}` : "Opportunity not linked"}</span>
                    {handover && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{project.actualHandoverDate ? "Handed over" : "Target"} {date.format(new Date(handover))}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
