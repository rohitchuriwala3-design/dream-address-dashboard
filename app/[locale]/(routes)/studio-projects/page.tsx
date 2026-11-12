import Link from "next/link";
import { ArrowRight, CalendarClock, FolderKanban, Plus, Ruler } from "lucide-react";
import { listStudioProjects } from "@/actions/studio-projects/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function StudioProjectsPage() {
  const projects = await listStudioProjects();
  const active = projects.filter((project) => !["COMPLETED", "CANCELLED"].includes(project.status)).length;
  const overdue = projects.filter((project) => project.targetHandoverDate && new Date(project.targetHandoverDate) < new Date() && project.status !== "COMPLETED").length;

  return <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-1 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-primary">Delivery workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Studio projects</h1><p className="mt-2 text-sm text-muted-foreground">Client-linked delivery records, milestones, scope, and handover dates.</p></div>
      <Button asChild><Link href="/studio-projects/new"><Plus className="mr-2 h-4 w-4" />Activate opportunity</Link></Button>
    </header>
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Project summary">
      <Summary label="Active projects" value={active} /><Summary label="Handover at risk" value={overdue} /><Summary label="All records" value={projects.length} />
    </section>
    {projects.length === 0 ? <Card><CardContent className="flex flex-col items-center py-14 text-center"><FolderKanban className="h-10 w-10 text-muted-foreground"/><h2 className="mt-4 text-lg font-semibold">No studio projects yet</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Activate an opportunity to create a client-linked delivery record with a starter milestone checklist.</p><Button asChild className="mt-5"><Link href="/studio-projects/new">Activate first project</Link></Button></CardContent></Card> :
      <section className="grid gap-4 lg:grid-cols-2" aria-label="Studio projects">{projects.map((project) => {
        const done = project.milestones.filter((milestone) => milestone.completedAt).length;
        return <Link href={`/studio-projects/${project.id}`} key={project.id} className="group">
          <Card className="h-full transition group-hover:border-primary/40 group-hover:shadow-sm"><CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs text-muted-foreground">{project.code}</p><h2 className="mt-1 text-lg font-semibold">{project.name}</h2><p className="mt-1 text-sm text-muted-foreground">{project.account.name}</p></div><StatusBadge status={project.status}/></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><Info icon={CalendarClock} label="Target handover" value={project.targetHandoverDate ? date.format(new Date(project.targetHandoverDate)) : "Not set"}/><Info icon={Ruler} label="Floor area" value={project.floorAreaSqFt ? `${Number(project.floorAreaSqFt).toLocaleString("en-IN")} sq ft` : "Not set"}/><Info icon={FolderKanban} label="Milestones" value={`${done} / ${project.milestones.length} complete`}/></div>
            <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm"><span className="font-medium tabular-nums">{project.contractValue ? money.format(Number(project.contractValue)) : "Contract value not set"}</span><span className="inline-flex items-center gap-1 text-primary">Open project <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></span></div>
          </CardContent></Card>
        </Link>;
      })}</section>}
  </main>;
}

function Summary({label,value}:{label:string;value:number}) { return <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></CardContent></Card>; }
function StatusBadge({status}:{status:string}) { return <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{status.replaceAll("_"," ")}</span>; }
function Info({icon:Icon,label,value}:{icon:typeof CalendarClock;label:string;value:string}) { return <div className="rounded-lg bg-muted/50 p-3"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5"/>{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>; }
