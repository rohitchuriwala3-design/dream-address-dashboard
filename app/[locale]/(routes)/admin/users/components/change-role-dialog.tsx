"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AppRole } from "@/lib/authz";
import { setUserRole } from "@/actions/admin/users/set-role";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleLabels: Record<AppRole, string> = {
  admin: "Admin · full access",
  manager: "Manager",
  user: "User",
  partner: "Partner · assigned accounts",
};

interface ChangeRoleDialogProps {
  userId: string;
  userName: string;
  email: string;
  currentRole: AppRole;
  role: AppRole;
  onRoleChange: (role: AppRole) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeRoleDialog({
  userId,
  userName,
  email,
  currentRole,
  role,
  onRoleChange,
  open,
  onOpenChange,
}: ChangeRoleDialogProps) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const save = async () => {
    if (role === currentRole) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      const result = await setUserRole(userId, role);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Access role changed to ${role}.`);
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Could not change the access role. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change access role</DialogTitle>
          <DialogDescription>
            Update the role for {userName} ({email}). Admin has full access; Partner is limited to assigned accounts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground">Current role: {roleLabels[currentRole]}</p>
          <Select value={role} onValueChange={(value) => onRoleChange(value as AppRole)} disabled={saving}>
            <SelectTrigger aria-label="New access role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(roleLabels) as AppRole[]).map((option) => (
                <SelectItem key={option} value={option}>{roleLabels[option]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {role === "partner" && currentRole !== "partner" && (
            <p className="text-xs text-muted-foreground">After changing to Partner, assign the client accounts this profile may access.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || role === currentRole}>
            {saving ? "Saving…" : "Save role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
