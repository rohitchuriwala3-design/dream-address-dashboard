"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Circle, RotateCcw } from "lucide-react";
import { setStudioProjectMilestoneCompleteAction, updateStudioProjectMilestoneDueDateAction, updateStudioProjectStatusAction } from "@/actions/studio-projects/actions";
import { STUDIO_PROJECT_STATUSES, type StudioProjectStatus } from "@/actions/studio-projects/status";
import { Button } from "@/components/ui/button";

const statusLabels: Record<StudioProjectStatus,string> = {
  PLANNING:"Planning", DESIGN:"Design", PROCUREMENT:"Procurement", EXECUTION:"Execution", HANDOVER:"Handover", COMPLETED:"Completed", ON_HOLD:"On hold", CANCELLED:"Cancelled",
};

export function ProjectStatusControl({projectId,status}:{projectId:string;status:StudioProjectStatus}) {
  const [pending,startTransition]=useTransition();
  const router=useRouter();
  return <label className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Status</span><select value={status} disabled={pending} onChange={(event)=>startTransition(async()=>{
    const result=await updateStudioProjectStatusAction(projectId,event.target.value as StudioProjectStatus);
    if("error" in result){toast.error(result.error);return;}
    toast.success("Project status updated");router.refresh();
  })} className="h-9 rounded-md border bg-background px-3 text-sm">{STUDIO_PROJECT_STATUSES.map((item)=><option key={item} value={item}>{statusLabels[item]}</option>)}</select></label>;
}

export function MilestoneToggle({projectId,milestoneId,completed,dueDate}:{projectId:string;milestoneId:string;completed:boolean;dueDate:string|null}) {
  const [pending,startTransition]=useTransition();
  const router=useRouter();
  return <div className="flex flex-wrap items-center gap-2"><input aria-label="Milestone due date" type="date" value={dueDate?.slice(0,10)??""} disabled={pending} className="h-8 rounded-md border bg-background px-2 text-xs" onChange={(event)=>startTransition(async()=>{
    const result=await updateStudioProjectMilestoneDueDateAction(projectId,milestoneId,event.target.value);
    if("error" in result){toast.error(result.error);return;}
    toast.success("Milestone due date updated");router.refresh();
  })}/><Button variant="ghost" size="sm" disabled={pending} onClick={()=>startTransition(async()=>{
    const result=await setStudioProjectMilestoneCompleteAction(projectId,milestoneId,!completed);
    if("error" in result){toast.error(result.error);return;}
    toast.success(completed?"Milestone reopened":"Milestone completed");router.refresh();
  })}>{completed?<><Check className="mr-2 h-4 w-4 text-emerald-600"/>Completed <RotateCcw className="ml-2 h-3.5 w-3.5"/></>:<><Circle className="mr-2 h-4 w-4"/>Mark complete</>}</Button></div>;
}
