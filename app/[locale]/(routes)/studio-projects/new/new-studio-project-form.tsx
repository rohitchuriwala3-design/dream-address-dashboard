"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createStudioProjectAction } from "@/actions/studio-projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OpportunityOption { id:string; name:string; accountName:string; currency:string; expectedRevenue:number; }

export function NewStudioProjectForm({opportunities}:{opportunities:OpportunityOption[]}) {
  const [pending,startTransition]=useTransition();
  const [selected,setSelected]=useState(opportunities[0]?.id ?? "");
  const router=useRouter();
  const selectedOpportunity=opportunities.find((item)=>item.id===selected);

  const submit=(formData:FormData)=>startTransition(async()=>{
    const result=await createStudioProjectAction({
      opportunityId:String(formData.get("opportunityId")??""),
      name:String(formData.get("name")??""),
      siteAddress:String(formData.get("siteAddress")??""),
      floorAreaSqFt:String(formData.get("floorAreaSqFt")??""),
      scopeOfWork:String(formData.get("scopeOfWork")??""),
      contractValue:String(formData.get("contractValue")??""),
      startDate:String(formData.get("startDate")??""),
      targetHandoverDate:String(formData.get("targetHandoverDate")??""),
    });
    if("error" in result){toast.error(result.error);return;}
    toast.success(result.alreadyExists?"This opportunity already has a project":"Studio project activated");
    router.push(`/studio-projects/${result.projectId}`);
    router.refresh();
  });

  return <form action={submit} className="space-y-5">
    <div className="space-y-2"><Label htmlFor="opportunityId">Client opportunity</Label><select id="opportunityId" name="opportunityId" required value={selected} onChange={(event)=>setSelected(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="" disabled>Select an opportunity</option>{opportunities.map((item)=><option key={item.id} value={item.id}>{item.name} · {item.accountName}</option>)}</select>
      {selectedOpportunity&&<p className="text-xs text-muted-foreground">Linked client: {selectedOpportunity.accountName}{selectedOpportunity.expectedRevenue>0?` · CRM forecast ${new Intl.NumberFormat("en-IN",{style:"currency",currency:selectedOpportunity.currency,maximumFractionDigits:0}).format(selectedOpportunity.expectedRevenue)}`:""}</p>}
    </div>
    <div className="space-y-2"><Label htmlFor="name">Project name</Label><Input id="name" name="name" required minLength={2} maxLength={160} placeholder="e.g. Sharma Residence — Full Interior"/></div>
    <div className="space-y-2"><Label htmlFor="siteAddress">Site address</Label><Textarea id="siteAddress" name="siteAddress" maxLength={500} rows={2} placeholder="Full project site address"/></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="floorAreaSqFt">Floor area (sq ft)</Label><Input id="floorAreaSqFt" name="floorAreaSqFt" type="number" min="0" step="0.01" placeholder="Leave blank if unknown"/></div><div className="space-y-2"><Label htmlFor="contractValue">Confirmed contract value (INR)</Label><Input id="contractValue" name="contractValue" type="number" min="0" step="0.01" placeholder="Enter only after approval"/></div></div>
    <div className="space-y-2"><Label htmlFor="scopeOfWork">Scope of work</Label><Textarea id="scopeOfWork" name="scopeOfWork" maxLength={5000} rows={4} placeholder="Approved scope and exclusions"/></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="startDate">Planned start</Label><Input id="startDate" name="startDate" type="date"/></div><div className="space-y-2"><Label htmlFor="targetHandoverDate">Target handover</Label><Input id="targetHandoverDate" name="targetHandoverDate" type="date"/></div></div>
    <div className="flex justify-end"><Button type="submit" disabled={pending||!selected}>{pending?"Activating…":"Activate project"}</Button></div>
  </form>;
}
