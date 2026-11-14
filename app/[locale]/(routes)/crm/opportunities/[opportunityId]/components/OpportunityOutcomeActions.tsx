"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CircleX } from "lucide-react";
import { setOpportunityOutcome } from "@/actions/crm/opportunities/set-opportunity-outcome";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function OpportunityOutcomeActions({
  opportunityId,
  status,
  sourceLead,
}: {
  opportunityId: string;
  status: string | null;
  sourceLead: { id: string; firstName: string | null; lastName: string } | null;
}) {
  const [lostMode, setLostMode] = useState(false);
  const [confirmWon, setConfirmWon] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const close = (outcome: "WON" | "LOST") => startTransition(async () => {
    const result = await setOpportunityOutcome({ opportunityId, outcome, note: outcome === "LOST" ? reason : "Client confirmed the job" });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(outcome === "WON" ? "Marked Won. You can now convert the lead to a client account." : "Marked Lost. No client account was created.");
    setLostMode(false);
    router.refresh();
  });

  if (status === "WON") {
    return sourceLead ? (
      <Button asChild size="sm" variant="outline">
        <Link href={`/crm/leads/${sourceLead.id}`}>Convert confirmed lead to Account</Link>
      </Button>
    ) : <span className="text-sm text-muted-foreground">Won · existing Account opportunity</span>;
  }
  if (status === "LOST") return <span className="text-sm text-muted-foreground">Lost opportunity · no Account conversion</span>;
  if (status !== "ACTIVE") return null;

  return (
    <div className="flex flex-wrap items-start gap-2">
      <AlertDialog open={confirmWon} onOpenChange={setConfirmWon}>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={pending} title="Use only after the client confirms the job">
            <Check className="mr-2 h-4 w-4" />Mark Won
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm the client has awarded this job?</AlertDialogTitle>
            <AlertDialogDescription>Marking this opportunity Won records the commercial outcome and enables converting its pre-closure Lead into a client Account. Internal quotation approval by itself does not count as client confirmation.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Go back</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={() => close("WON")}>{pending ? "Saving…" : "Yes, client confirmed"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!lostMode ? (
        <Button size="sm" variant="outline" onClick={() => setLostMode(true)} disabled={pending}>
          <CircleX className="mr-2 h-4 w-4" />Mark Lost
        </Button>
      ) : (
        <div className="w-full max-w-md space-y-2 rounded-md border p-3">
          <label htmlFor={`lost-reason-${opportunityId}`} className="text-sm font-medium">Why was this opportunity lost?</label>
          <Textarea id={`lost-reason-${opportunityId}`} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="For example: timing, budget, selected another provider" />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => close("LOST")} disabled={pending || !reason.trim()}>{pending ? "Saving…" : "Confirm Lost"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setLostMode(false)} disabled={pending}>Cancel</Button>
          </div>
        </div>
      )}
      {sourceLead && <p className="w-full text-xs text-muted-foreground">Pre-closure lead: <Link className="underline" href={`/crm/leads/${sourceLead.id}`}>{[sourceLead.firstName, sourceLead.lastName].filter(Boolean).join(" ")}</Link>. Mark Won only after client confirmation; internal quote approval is a separate step.</p>}
    </div>
  );
}
