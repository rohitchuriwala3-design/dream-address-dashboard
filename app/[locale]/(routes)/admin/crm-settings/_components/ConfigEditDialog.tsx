"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateConfigValue, type CrmConfigType } from "../_actions/crm-settings";
import { STAGE_KINDS, type StageKind } from "@/lib/crm/stage-kinds";
import { toast } from "sonner";

const KIND_NONE = "__none__";

interface Props {
  configType: CrmConfigType;
  id: string;
  currentName: string;
  currentStageKind?: string | null;
  currentStageOrder?: number | null;
  currentProbability?: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ConfigEditDialog({ configType, id, currentName, currentStageKind, currentStageOrder, currentProbability, open, onOpenChange }: Props) {
  const [name, setName] = useState(currentName);
  const [stageKind, setStageKind] = useState<string>(currentStageKind ?? KIND_NONE);
  const [stageOrder, setStageOrder] = useState(String(currentStageOrder ?? 0));
  const [probability, setProbability] = useState(String(currentProbability ?? 0));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateConfigValue(
        configType,
        id,
        name,
        configType === "salesStage"
          ? (stageKind === KIND_NONE ? null : (stageKind as StageKind))
          : undefined,
        configType === "salesStage" ? Number(stageOrder) : undefined,
        configType === "salesStage" ? Number(probability) : undefined
      );
      toast.success("Updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Value</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </div>
          {configType === "salesStage" && (
            <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="edit-stage-order">Board order</Label>
                <Input id="edit-stage-order" type="number" min={0} max={1000} step={1} value={stageOrder} onChange={(e) => setStageOrder(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-stage-probability">Forecast probability (%)</Label>
                <Input id="edit-stage-probability" type="number" min={0} max={100} step={1} value={probability} onChange={(e) => setProbability(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Automation trigger</Label>
              <Select value={stageKind} onValueChange={setStageKind}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KIND_NONE}>None</SelectItem>
                  {STAGE_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
