"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ConfigValue } from "../_actions/crm-settings";
import { updateAdminLeadStatusOrder } from "../_actions/crm-settings";

export function LeadStatusPathTab({ statuses, initialOrder }: { statuses: ConfigValue[]; initialOrder: string[] }) {
  const [order, setOrder] = useState(() => {
    const known = new Set(statuses.map((status) => status.id));
    return [...initialOrder.filter((id) => known.has(id)), ...statuses.map((status) => status.id).filter((id) => !initialOrder.includes(id))];
  });
  const [saving, setSaving] = useState(false);
  const byId = new Map(statuses.map((status) => [status.id, status]));

  function move(index: number, offset: number) {
    setOrder((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try { await updateAdminLeadStatusOrder(order); toast.success("Lead status path saved"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not save lead status path"); }
    finally { setSaving(false); }
  }

  return <section className="max-w-3xl space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Lead status path</h2><p className="text-sm text-muted-foreground">Set the order shown by the status progress bar on each lead record. This is a display path, not a sales probability.</p></div><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save status order"}</Button></div>
    {order.length ? <ol className="divide-y rounded-lg border">{order.map((id, index) => <li key={id} className="flex items-center gap-3 p-3"><span className="w-7 text-center text-xs text-muted-foreground">{index + 1}</span><span className="min-w-0 flex-1 text-sm font-medium">{byId.get(id)?.name ?? "Removed status"}</span><span className="text-xs text-muted-foreground">{byId.get(id)?.usageCount ?? 0} leads</span><Button size="icon" variant="ghost" aria-label={`Move ${byId.get(id)?.name} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`Move ${byId.get(id)?.name} down`} disabled={index === order.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button></li>)}</ol> : <p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">Add lead statuses to define the status path.</p>}
  </section>;
}
