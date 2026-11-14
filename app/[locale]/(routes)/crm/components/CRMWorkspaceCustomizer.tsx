"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const PREFS_KEY = "mark4.crm.workbench.v1";
type Widget = { id: string; label: string };
type LayoutContextValue = { visible: string[]; order: string[] };
const LayoutContext = createContext<LayoutContextValue>({ visible: [], order: [] });

export function CRMWorkspaceCustomizer({ widgets, children }: { widgets: Widget[]; children: ReactNode }) {
  const ids = useMemo(() => widgets.map((widget) => widget.id), [widgets]);
  const [visible, setVisible] = useState(ids);
  const [order, setOrder] = useState(ids);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(PREFS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { visible?: unknown; order?: unknown };
          if (Array.isArray(parsed.visible)) setVisible(parsed.visible.filter((id): id is string => typeof id === "string" && ids.includes(id)));
          if (Array.isArray(parsed.order)) {
            const savedOrder = parsed.order.filter((id): id is string => typeof id === "string" && ids.includes(id));
            setOrder([...savedOrder, ...ids.filter((id) => !savedOrder.includes(id))]);
          }
        }
      } catch { /* Use defaults if stored layout is invalid. */ }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ids]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ visible, order })); }
    catch { /* Workspace continues to work if browser storage is unavailable. */ }
  }, [visible, order, loaded]);

  function move(id: string, step: -1 | 1) {
    setOrder((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + step;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  return <LayoutContext.Provider value={{ visible, order }}>
    <div className="mb-3 flex justify-end">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><Button variant="outline" size="sm"><Settings2 className="mr-2 h-4 w-4" />Customize dashboard</Button></SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>Customize CRM workbench</SheetTitle><SheetDescription>Show, hide, and arrange dashboard sections. This layout is saved in this browser.</SheetDescription></SheetHeader>
          <div className="mt-6 space-y-2">{order.map((id, index) => {
            const widget = widgets.find((item) => item.id === id);
            if (!widget) return null;
            return <div key={id} className="flex items-center gap-2 rounded-lg border p-2.5">
              <Checkbox aria-label={`Show ${widget.label}`} checked={visible.includes(id)} onCheckedChange={(checked) => setVisible((current) => checked ? current.includes(id) ? current : current.concat(id) : current.filter((item) => item !== id))} />
              <span className="min-w-0 flex-1 text-sm font-medium">{widget.label}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move ${widget.label} up`} disabled={index === 0} onClick={() => move(id, -1)}><ChevronUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move ${widget.label} down`} disabled={index === order.length - 1} onClick={() => move(id, 1)}><ChevronDown className="h-4 w-4" /></Button>
            </div>;
          })}</div>
          <Button className="mt-5" variant="outline" onClick={() => { setVisible(ids); setOrder(ids); }}>Reset dashboard layout</Button>
        </SheetContent>
      </Sheet>
    </div>
    {children}
  </LayoutContext.Provider>;
}

export function CRMWorkspaceWidget({ id, className = "", children }: { id: string; className?: string; children: ReactNode }) {
  const { visible, order } = useContext(LayoutContext);
  if (!visible.includes(id)) return null;
  return <div className={className} style={{ order: order.indexOf(id) < 0 ? 99 : order.indexOf(id) }}>{children}</div>;
}
