"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateContact } from "@/actions/crm/contacts/update-contact";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function ContactNotes({ contactId, initialNotes }: { contactId: string; initialNotes: string[] }) {
  const [notes, setNotes] = useState(initialNotes ?? []);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const saveNotes = (nextNotes: string[]) => {
    startTransition(async () => {
      const result = await updateContact({ id: contactId, notes: nextNotes });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNotes(result.data?.notes ?? nextNotes);
      router.refresh();
    });
  };

  const addNote = () => {
    const note = draft.trim();
    if (!note) return;
    if (note.length > 5000) {
      toast.error("Keep each note under 5,000 characters.");
      return;
    }
    if (notes.length >= 200) {
      toast.error("This contact has reached the 200-note limit.");
      return;
    }
    saveNotes([...notes, note]);
    setDraft("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Notes</CardTitle>
        <CardDescription>Keep useful context attached to this contact.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            aria-label="New contact note"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a meeting note, preference, or important detail…"
            rows={3}
            maxLength={5000}
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button onClick={addNote} disabled={isPending || !draft.trim()} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add note
            </Button>
          </div>
        </div>

        {notes.length ? (
          <ul className="space-y-2">
            {notes.map((note, index) => (
              <li key={`${index}-${note.slice(0, 24)}`} className="flex items-start gap-3 rounded-md border p-3">
                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm">{note}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete note ${index + 1}`}
                  title="Delete note"
                  disabled={isPending}
                  onClick={() => saveNotes(notes.filter((_, noteIndex) => noteIndex !== index))}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No notes yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
