"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NEXUS_PERMISSIONS, type NexusPermission } from "@/lib/authz/permission-catalog";
import { setUserPermissions } from "@/actions/admin/users/set-user-permissions";

interface Props {
  userId: string;
  email: string;
  initialPermissions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfilePermissionsDialog({ userId, email, initialPermissions, open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<NexusPermission[]>(initialPermissions as NexusPermission[]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toggle = (key: NexusPermission, checked: boolean) => setSelected((current) => checked ? Array.from(new Set([...current, key])) : current.filter((item) => item !== key));

  async function save() {
    setLoading(true);
    try {
      const result = await setUserPermissions(userId, selected);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Profile permissions saved.");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Could not save profile permissions.");
    } finally { setLoading(false); }
  }

  return <Dialog open={open} onOpenChange={(next) => { if (!loading) onOpenChange(next); }}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Profile permissions</DialogTitle>
        <DialogDescription>Module permissions for {email}. This rollout is incomplete: existing role and record-scope rules still control access, and these selections do not yet unlock or restrict every module.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2 sm:grid-cols-2">
        {NEXUS_PERMISSIONS.map(({ key, label, description }) => <label key={key} htmlFor={`permission-${key}`} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50">
          <Checkbox id={`permission-${key}`} checked={selected.includes(key)} onCheckedChange={(value) => toggle(key, value === true)} disabled={loading} />
          <span className="grid gap-1"><span className="text-sm font-medium">{label}</span><span className="text-xs text-muted-foreground">{description}</span></span>
        </label>)}
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button><Button onClick={save} disabled={loading}>{loading ? "Saving…" : "Save permissions"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
