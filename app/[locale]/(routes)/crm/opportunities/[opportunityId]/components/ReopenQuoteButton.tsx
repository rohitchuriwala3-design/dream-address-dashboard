"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reopenApprovedQuote } from "@/actions/crm/opportunities/approval";

export default function ReopenQuoteButton({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    try {
      const result = await reopenApprovedQuote(opportunityId, note);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Quotation reopened for revision");
      setOpen(false);
      setNote("");
      router.refresh();
    } finally { setBusy(false); }
  };

  return <div className="flex flex-col items-end gap-2">
    {!open ? <Button variant="outline" size="sm" onClick={() => setOpen(true)}><FilePenLine className="mr-2 h-4 w-4"/>Reopen quote</Button> : <>
      <Textarea aria-label="Revision reason" placeholder="Reason for revision (recorded in quote history)" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} className="w-64"/>
      <div className="flex gap-2"><Button variant="ghost" size="sm" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" disabled={busy} onClick={submit}>{busy ? "Reopening…" : "Confirm revision"}</Button></div>
    </>}
  </div>;
}
