"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LeadDetailCard({ title, description, action, children, defaultOpen = true }: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  return <Card>
    <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
      <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
        {action}
        <Button type="button" size="icon" variant="ghost" aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
    </CardHeader>
    {expanded && children}
  </Card>;
}
