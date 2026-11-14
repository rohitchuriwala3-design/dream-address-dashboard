"use client";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActivityEntry } from "./ActivityEntry";
import { ActivityForm } from "./ActivityForm";
import { getActivitiesByEntity } from "@/actions/crm/activities/get-activities-by-entity";
import type {
  ActivityWithLinks,
  ActivityCursor,
} from "@/actions/crm/activities/get-activities-by-entity";

interface Props {
  entityType: string;
  entityId: string;
  initialData: { data: ActivityWithLinks[]; nextCursor: ActivityCursor | null };
}

export function ActivitiesView({ entityType, entityId, initialData }: Props) {
  const [activities, setActivities] = useState<ActivityWithLinks[]>(initialData.data);
  const [cursor, setCursor] = useState<ActivityCursor | null>(initialData.nextCursor);
  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [activityFilter, setActivityFilter] = useState<"all" | "overdue" | "upcoming" | "completed">("all");
  const [now, setNow] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    updateNow();
    const interval = window.setInterval(updateNow, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const loadMore = () => {
    if (!cursor) return;
    startTransition(async () => {
      const result = await getActivitiesByEntity(entityType, entityId, cursor);
      setActivities((prev) => [...prev, ...result.data]);
      setCursor(result.nextCursor);
    });
  };

  const handleCreated = (activity: ActivityWithLinks) => {
    setActivities((prev) => [activity, ...prev]);
  };

  const handleUpdated = (updated: ActivityWithLinks) => {
    setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleted = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const referenceTime = now ?? 0;
  const overdueCount = now === null ? 0 : activities.filter((activity) => activity.status === "scheduled" && new Date(activity.date).getTime() < referenceTime).length;
  const upcomingCount = now === null ? 0 : activities.filter((activity) => activity.status === "scheduled" && new Date(activity.date).getTime() >= referenceTime).length;
  const filteredActivities = activities.filter((activity) => {
    if (activityFilter === "overdue") return now !== null && activity.status === "scheduled" && new Date(activity.date).getTime() < referenceTime;
    if (activityFilter === "upcoming") return now !== null && activity.status === "scheduled" && new Date(activity.date).getTime() >= referenceTime;
    if (activityFilter === "completed") return activity.status === "completed";
    return true;
  }).sort((left, right) => {
    const leftDate = new Date(left.date).getTime();
    const rightDate = new Date(right.date).getTime();
    const group = (date: number, status: string) => status === "scheduled" ? date < referenceTime ? 0 : 1 : 2;
    const difference = group(leftDate, left.status) - group(rightDate, right.status);
    if (difference) return difference;
    return group(leftDate, left.status) < 2 ? leftDate - rightDate : rightDate - leftDate;
  });

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <CardTitle className="text-base">Follow-ups & activity</CardTitle>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{activities.length} {activities.length === 1 ? "item" : "items"}</span>
              {overdueCount > 0 && <span className="font-medium text-destructive">{overdueCount} overdue</span>}
              {upcomingCount > 0 && <span>{upcomingCount} upcoming</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add follow-up
            </Button>
            <Button type="button" size="icon" variant="ghost" aria-label={expanded ? "Collapse follow-ups and activity" : "Expand follow-ups and activity"} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {expanded && <CardContent className="pt-0">
          <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Filter follow-ups and activity">
            {(["all", "overdue", "upcoming", "completed"] as const).map((filter) => <Button key={filter} type="button" size="sm" variant={activityFilter === filter ? "secondary" : "ghost"} onClick={() => setActivityFilter(filter)}>
              {filter === "all" ? "All" : filter === "overdue" ? `Overdue${overdueCount ? ` (${overdueCount})` : ""}` : filter === "upcoming" ? `Upcoming${upcomingCount ? ` (${upcomingCount})` : ""}` : "Completed"}
            </Button>)}
          </div>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No activities yet. Log a call, meeting, or note.
            </p>
          ) : filteredActivities.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">No {activityFilter} items for this lead.</p>
          ) : (
            <>
              {filteredActivities.map((activity) => (
                <ActivityEntry
                  key={activity.id}
                  activity={activity}
                  entityType={entityType}
                  entityId={entityId}
                  onDeleted={handleDeleted}
                  onUpdated={handleUpdated}
                />
              ))}
              {cursor && (
                <div className="flex justify-center pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMore}
                    disabled={isPending}
                  >
                    {isPending ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>}

        <ActivityForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          entityType={entityType}
          entityId={entityId}
          onSaved={handleCreated}
        />
      </Card>
    </TooltipProvider>
  );
}
