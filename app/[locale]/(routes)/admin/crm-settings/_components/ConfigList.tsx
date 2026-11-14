"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { ConfigEditDialog } from "./ConfigEditDialog";
import { ConfigDeleteDialog } from "./ConfigDeleteDialog";
import { ConfigAddDialog } from "./ConfigAddDialog";
import type { CrmConfigType, ConfigValue } from "../_actions/crm-settings";

interface Props {
  configType: CrmConfigType;
  label: string;
  values: ConfigValue[];
}

export function ConfigList({ configType, label, values }: Props) {
  const [editItem, setEditItem] = useState<ConfigValue | null>(null);
  const [deleteItem, setDeleteItem] = useState<ConfigValue | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{values.length} value{values.length !== 1 ? "s" : ""}</p>
        <ConfigAddDialog
          key={`${configType}-${configType === "salesStage" ? Math.max(-10, ...values.map((value) => value.stageOrder ?? -10)) + 10 : "default"}`}
          configType={configType}
          label={label}
          defaultStageOrder={configType === "salesStage" ? Math.max(-10, ...values.map((value) => value.stageOrder ?? -10)) + 10 : undefined}
        />
      </div>
      <div className="divide-y rounded-md border">
        {values.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted-foreground">No values yet.</p>
        )}
        {values.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{item.name}</span>
              {item.usageCount > 0 && (
                <Badge variant="secondary">{item.usageCount} in use</Badge>
              )}
              {item.stageKind && (
                <Badge variant="outline">{item.stageKind}</Badge>
              )}
              {configType === "salesStage" && item.stageOrder != null && (
                <Badge variant="secondary">Order {item.stageOrder}</Badge>
              )}
              {configType === "salesStage" && item.probability != null && (
                <Badge variant="outline">{item.probability}% forecast</Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditItem(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={values.length <= 1}
                title={values.length <= 1 ? "Cannot delete the last value" : undefined}
                onClick={() => setDeleteItem(item)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {editItem && (
        <ConfigEditDialog
          configType={configType}
          id={editItem.id}
          currentName={editItem.name}
          currentStageKind={editItem.stageKind ?? null}
          currentStageOrder={editItem.stageOrder ?? ((values.findIndex((value) => value.id === editItem.id) + 1) * 10)}
          currentProbability={editItem.probability}
          open={!!editItem}
          onOpenChange={(v) => { if (!v) setEditItem(null); }}
        />
      )}
      {deleteItem && (
        <ConfigDeleteDialog
          configType={configType}
          item={deleteItem}
          allValues={values}
          open={!!deleteItem}
          onOpenChange={(v) => { if (!v) setDeleteItem(null); }}
        />
      )}
    </div>
  );
}
