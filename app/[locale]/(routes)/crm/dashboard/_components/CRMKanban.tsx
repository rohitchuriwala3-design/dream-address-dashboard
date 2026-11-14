"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  crm_Opportunities,
  crm_Opportunities_Sales_Stages,
} from "@prisma/client";

import { DotsHorizontalIcon, PlusCircledIcon } from "@radix-ui/react-icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const formatINR = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
    : "—";
};

import { NewOpportunityForm } from "../../opportunities/components/NewOpportunityForm";
import { updateOpportunity } from "@/actions/crm/opportunities/update-opportunity";
import { getPipelineMetrics } from "./pipeline-metrics";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface CRMKanbanProps {
  salesStages: crm_Opportunities_Sales_Stages[];
  opportunities: crm_Opportunities[];
  crmData: any;
}

type Column = crm_Opportunities_Sales_Stages & {
  opportunities: crm_Opportunities[];
};

const BOARD_PREFS_KEY = "mark4.crm.opportunity-board.v1";
const DEFAULT_VISIBLE_METRICS = ["open", "pipeline", "weighted", "missing", "overdue", "close"];

function initColumns(
  opps: crm_Opportunities[],
  stages: crm_Opportunities_Sales_Stages[]
): Column[] {
  return stages.map((stage) => ({
    ...stage,
    opportunities: opps.filter(
      (o: any) => o.sales_stage === stage.id && o.status === "ACTIVE"
    ),
  }));
}

// Draggable Opportunity Card
function OpportunityCard({ opportunity }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="my-2 w-full cursor-grab active:cursor-grabbing"
    >
      <CardTitle className="p-2 text-sm">
        <div className="flex justify-between p-2">
          <span className="font-bold">{opportunity.name}</span>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <DotsHorizontalIcon className="w-4 h-4 text-slate-600" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem asChild>
                  <a href={`/crm/opportunities/${opportunity.id}`} target="_blank" rel="noreferrer">
                    Open details in new tab
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardTitle>
      <CardContent className="text-xs text-muted-foreground">
        <div className="flex flex-col space-y-1">
          <div className="overflow-hidden">
            <HoverCard>
              <HoverCardTrigger>
                {opportunity.description?.substring(0, 200)}
              </HoverCardTrigger>
              <HoverCardContent className="overflow-hidden">
                {opportunity.description}
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="space-x-1">
            <span>Amount:</span>
            <span>{opportunity.budget == null ? "—" : formatINR(opportunity.budget)}</span>
          </div>
          <div className="space-x-1">
            <span>Expected closing:</span>
            <span
              className={
                opportunity.close_date &&
                new Date(opportunity.close_date) < new Date()
                  ? "text-red-500"
                  : ""
              }
            >
              {opportunity.close_date
                ? format(new Date(opportunity.close_date), "dd/MM/yyyy")
                : "Not set"}
            </span>
          </div>
          {opportunity.next_step?.trim() ? (
            <div className="line-clamp-2">
              <span>Next:</span> {opportunity.next_step}
            </div>
          ) : null}
          <div>
            Follow-up due: {opportunity.next_step_due_at
              ? format(new Date(opportunity.next_step_due_at), "dd/MM/yyyy")
              : "Not set"}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-start">
        <div className="flex text-xs items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage
              src={
                opportunity.assigned_to_user?.avatar
                  ? opportunity.assigned_to_user.avatar
                  : "/images/nouser.png"
              }
            />
          </Avatar>
          <span className="text-xs">{opportunity.assigned_to_user?.name}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

// Droppable zone inside each column — same pattern as DroppableColumn in Kanban.tsx
function DroppableStage({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="min-h-[50px]">
      {children}
    </div>
  );
}

const CRMKanban = ({
  salesStages,
  opportunities: data,
  crmData,
}: CRMKanbanProps) => {
  const [selectedStage, setSelectedStage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(DEFAULT_VISIBLE_METRICS);
  const [visibleStages, setVisibleStages] = useState<string[]>(salesStages.map((stage) => stage.id));
  const [showWon, setShowWon] = useState(true);
  const [showLost, setShowLost] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(BOARD_PREFS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { metrics?: unknown; stages?: unknown; won?: unknown; lost?: unknown; inactive?: unknown };
          if (Array.isArray(parsed.metrics)) setVisibleMetrics(parsed.metrics.filter((value): value is string => typeof value === "string"));
          if (Array.isArray(parsed.stages)) setVisibleStages(parsed.stages.filter((value): value is string => typeof value === "string"));
          if (typeof parsed.won === "boolean") setShowWon(parsed.won);
          if (typeof parsed.lost === "boolean") setShowLost(parsed.lost);
          if (typeof parsed.inactive === "boolean") setShowInactive(parsed.inactive);
        }
      } catch { /* Ignore corrupt preference data and use defaults. */ }
      setPreferencesLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    try { localStorage.setItem(BOARD_PREFS_KEY, JSON.stringify({ metrics: visibleMetrics, stages: visibleStages, won: showWon, lost: showLost, inactive: showInactive })); }
    catch { /* The board remains usable if browser storage is unavailable. */ }
  }, [preferencesLoaded, visibleMetrics, visibleStages, showWon, showLost, showInactive]);

  const serverDataRef = useRef(data);
  const [columns, setColumns] = useState<Column[]>(() =>
    initColumns(data, salesStages)
  );
  const columnsRef = useRef<Column[]>(columns);
  columnsRef.current = columns;

  const [activeOpportunity, setActiveOpportunity] =
    useState<crm_Opportunities | null>(null);
  const origStageIdRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);

  const { accounts, contacts, saleTypes, saleStages, campaigns, currencies } = crmData;

  // Sync refreshed server state only when a drag interaction is not underway.
  useEffect(() => {
    if (serverDataRef.current !== data && !isDraggingRef.current) {
      serverDataRef.current = data;
      setColumns(initColumns(data, salesStages));
    }
  }, [data, salesStages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    const { active } = event;
    const activeId = active.id as string;
    for (const col of columnsRef.current) {
      const opp = col.opportunities.find((o) => o.id === activeId);
      if (opp) {
        setActiveOpportunity(opp);
        origStageIdRef.current = col.id;
        break;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const current = columnsRef.current;

    // Find source column and opportunity index
    let fromColIdx = -1,
      fromOppIdx = -1;
    for (let i = 0; i < current.length; i++) {
      const idx = current[i].opportunities.findIndex((o) => o.id === activeId);
      if (idx !== -1) {
        fromColIdx = i;
        fromOppIdx = idx;
        break;
      }
    }
    if (fromColIdx === -1) return;

    // Determine destination — overId is either a stage ID or an opportunity ID
    let toColIdx = current.findIndex((c) => c.id === overId);
    let toOppIdx = 0;
    const isOverColumn = toColIdx !== -1;

    if (!isOverColumn) {
      for (let i = 0; i < current.length; i++) {
        const idx = current[i].opportunities.findIndex((o) => o.id === overId);
        if (idx !== -1) {
          toColIdx = i;
          toOppIdx = idx;
          break;
        }
      }
    } else {
      toOppIdx = current[toColIdx].opportunities.length;
    }

    if (toColIdx === -1) return;
    if (fromColIdx === toColIdx) return;

    const newColumns = current.map((c) => ({
      ...c,
      opportunities: [...c.opportunities],
    }));
    const [movedOpp] = newColumns[fromColIdx].opportunities.splice(
      fromOppIdx,
      1
    );
    (movedOpp as any).sales_stage = newColumns[toColIdx].id;
    newColumns[toColIdx].opportunities.splice(toOppIdx, 0, movedOpp);
    columnsRef.current = newColumns;
    setColumns(newColumns);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    isDraggingRef.current = false;
    const { active } = event;
    setActiveOpportunity(null);

    const activeId = active.id as string;
    const current = columnsRef.current;

    // Find where the opportunity ended up after handleDragOver moves
    let curColIdx = -1;
    for (let i = 0; i < current.length; i++) {
      if (current[i].opportunities.find((o) => o.id === activeId)) {
        curColIdx = i;
        break;
      }
    }
    if (curColIdx === -1) return;

    const curStageId = current[curColIdx].id;
    const wasCrossStageMove =
      origStageIdRef.current !== null &&
      origStageIdRef.current !== curStageId;

    if (!wasCrossStageMove) return;

    try {
      const result = await updateOpportunity({
        id: activeId,
        sales_stage: curStageId,
      });
      if (result?.error) {
        toast.error(result.error);
        columnsRef.current = initColumns(data, salesStages);
        setColumns(initColumns(data, salesStages));
      } else {
        toast.success("Opportunity stage changed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
      columnsRef.current = initColumns(data, salesStages);
      setColumns(initColumns(data, salesStages));
    }
  };

  // Explicit outcomes are different from legacy INACTIVE records.
  const lostOpportunities = data.filter(
    (o: any) => o.status === "LOST"
  );
  const wonOpportunities = data.filter((o: any) => o.status === "WON");
  const inactiveOpportunities = data.filter((o: any) => o.status === "INACTIVE");
  const metrics = getPipelineMetrics(data, salesStages);

  const metricCards = [
    ["open", "Open opportunities", metrics.openCount],
    ["pipeline", "Expected pipeline", formatINR(metrics.pipelineValue)],
    ["weighted", "Probability weighted", formatINR(metrics.weightedValue)],
    ["missing", "Missing next step", metrics.missingNextStep],
    ["overdue", "Follow-up overdue", metrics.overdueFollowUps],
    ["close", "Past expected close", metrics.overdueCloseDates],
  ] as const;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Sheet open={customizeOpen} onOpenChange={setCustomizeOpen}>
          <SheetTrigger asChild><Button variant="outline" size="sm"><Settings2 className="mr-2 h-4 w-4" />Customize board</Button></SheetTrigger>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader><SheetTitle>Customize opportunity board</SheetTitle><SheetDescription>Choose which summary cards and pipeline lanes to show. Your choices are saved in this browser.</SheetDescription></SheetHeader>
            <div className="mt-6 space-y-6">
              <section className="space-y-3"><h3 className="text-sm font-semibold">Summary cards</h3>{metricCards.map(([id, label]) => <label key={id} className="flex items-center gap-3 text-sm"><Checkbox checked={visibleMetrics.includes(id)} onCheckedChange={(checked) => setVisibleMetrics((current) => checked ? current.includes(id) ? current : current.concat(id) : current.filter((item) => item !== id))} />{label}</label>)}</section>
              <section className="space-y-3"><h3 className="text-sm font-semibold">Pipeline stages</h3>{salesStages.map((stage) => <label key={stage.id} className="flex items-center gap-3 text-sm"><Checkbox checked={visibleStages.includes(stage.id)} onCheckedChange={(checked) => setVisibleStages((current) => checked ? current.includes(stage.id) ? current : current.concat(stage.id) : current.filter((item) => item !== stage.id))} />{stage.name}</label>)}</section>
              <section className="space-y-3"><h3 className="text-sm font-semibold">Closed lanes</h3>{[["won", "Won", showWon, setShowWon], ["lost", "Lost", showLost, setShowLost], ["inactive", "Inactive", showInactive, setShowInactive]].map(([id, label, checked, setChecked]) => <label key={String(id)} className="flex items-center gap-3 text-sm"><Checkbox checked={checked as boolean} onCheckedChange={(value) => (setChecked as (value: boolean) => void)(Boolean(value))} />{String(label)}</label>)}</section>
              <Button variant="ghost" onClick={() => { setVisibleMetrics(DEFAULT_VISIBLE_METRICS); setVisibleStages(salesStages.map((stage) => stage.id)); setShowWon(true); setShowLost(true); setShowInactive(true); }}>Reset board layout</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <section aria-label="Opportunity pipeline summary" className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metricCards.filter(([id]) => visibleMetrics.includes(id)).map(([id, label, value]) => <Card key={id}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></CardContent></Card>)}
      </section>
      <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl max-h-[90dvh] overflow-y-auto py-6 sm:py-10">
          <NewOpportunityForm
            accounts={accounts}
            contacts={contacts}
            salesType={saleTypes}
            saleStages={saleStages}
            campaigns={campaigns}
            currencies={(currencies ?? []).map((c: any) => ({ code: c.code, name: c.name, symbol: c.symbol }))}
            selectedStage={selectedStage}
            onDialogClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex w-full h-full overflow-x-auto">
          {columns.filter((col) => visibleStages.includes(col.id)).map((col) => (
            <Card
              key={col.id}
              className="mx-1 w-full min-w-[300px] overflow-hidden pb-10"
            >
              <CardTitle className="flex gap-2 p-3 justify-between">
                <span className="text-sm font-bold">{col.name}</span>
                <PlusCircledIcon
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => {
                    setSelectedStage(col.id);
                    setIsDialogOpen(true);
                  }}
                />
              </CardTitle>
              <CardContent className="w-full h-full overflow-y-auto">
                <SortableContext
                  items={col.opportunities.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableStage id={col.id}>
                    {col.opportunities.map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                      />
                    ))}
                  </DroppableStage>
                </SortableContext>
              </CardContent>
            </Card>
          ))}

          {/* Closed wins remain visible and link to the lead conversion action. */}
          {showWon && <Card className="mx-1 w-full min-w-[300px] overflow-hidden pb-10">
            <CardTitle className="flex gap-2 p-3 justify-between">
              <span className="text-sm font-bold">Won</span>
              <span className="text-xs text-muted-foreground">{wonOpportunities.length}</span>
            </CardTitle>
            <CardContent className="w-full h-full overflow-y-auto space-y-2">
              {wonOpportunities.map((opportunity: any) => (
                <Card key={opportunity.id}>
                  <CardTitle className="p-3 text-sm">
                    <a href={`/crm/opportunities/${opportunity.id}`} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                      {opportunity.name || "Untitled opportunity"}
                    </a>
                  </CardTitle>
                  <CardContent className="text-xs text-muted-foreground">
                    <div>{opportunity.budget == null ? "—" : formatINR(opportunity.budget)}</div>
                    {opportunity.sourceLeadId ? <p className="mt-1">Won lead · open details to complete account conversion</p> : null}
                  </CardContent>
                </Card>
              ))}
              {wonOpportunities.length === 0 ? <p className="py-4 text-xs text-muted-foreground">No won opportunities yet.</p> : null}
            </CardContent>
          </Card>}

          {showLost && <Card className="mx-1 w-full min-w-[300px] overflow-hidden pb-10">
            <CardTitle className="flex gap-2 p-3 justify-between">
              <span className="text-sm font-bold">Lost</span>
              <span className="text-xs text-muted-foreground">{lostOpportunities.length}</span>
            </CardTitle>
            <CardContent className="w-full h-full overflow-y-scroll space-y-2">
              {lostOpportunities.map((opportunity: any) => (
                <Card key={opportunity.id}>
                  <CardTitle className="p-2 text-sm">
                    <a href={`/crm/opportunities/${opportunity.id}`} target="_blank" rel="noreferrer" className="font-bold hover:underline">{opportunity?.name || "Untitled opportunity"}</a>
                  </CardTitle>
                  <CardContent className="text-xs text-muted-foreground">
                    <div>Potential: {opportunity.budget == null ? "—" : formatINR(opportunity.budget)}</div>
                    {opportunity.outcomeNote ? <div className="mt-1 line-clamp-3">Reason: {opportunity.outcomeNote}</div> : null}
                  </CardContent>
                </Card>
              ))}
              {lostOpportunities.length === 0 ? <p className="py-4 text-xs text-muted-foreground">No lost opportunities yet.</p> : null}
            </CardContent>
          </Card>}

          {showInactive && inactiveOpportunities.length > 0 ? (
            <Card className="mx-1 w-full min-w-[300px] overflow-hidden pb-10">
              <CardTitle className="flex gap-2 p-3 justify-between"><span className="text-sm font-bold">Inactive</span><span className="text-xs text-muted-foreground">{inactiveOpportunities.length}</span></CardTitle>
              <CardContent className="space-y-2">
                {inactiveOpportunities.map((opportunity: any) => <Card key={opportunity.id}>
                  <CardTitle className="p-3 text-sm"><a href={`/crm/opportunities/${opportunity.id}`} target="_blank" rel="noreferrer" className="font-semibold hover:underline">{opportunity.name || "Untitled opportunity"}</a></CardTitle>
                  <CardContent className="text-xs text-muted-foreground">{opportunity.budget == null ? "—" : formatINR(opportunity.budget)}</CardContent>
                </Card>)}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <DragOverlay>
          {activeOpportunity ? (
            <Card className="my-2 w-[280px] opacity-80 bg-white shadow-lg">
              <CardTitle className="p-2 text-sm">
                <div className="flex justify-between p-2">
                  <span className="font-bold">{activeOpportunity.name}</span>
                </div>
              </CardTitle>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
};

export default CRMKanban;
