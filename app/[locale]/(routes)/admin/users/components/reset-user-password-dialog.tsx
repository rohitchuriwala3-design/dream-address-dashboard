"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { resetUserPassword } from "@/actions/admin/users/reset-user-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  userId: string;
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetUserPasswordDialog({ userId, email, open, onOpenChange }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = async () => {
    if (password.length < 12 || password.length > 128) {
      toast.error("Use a password between 12 and 128 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await resetUserPassword(userId, password);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setPassword("");
      setConfirmPassword("");
      onOpenChange(false);
      toast.success(`Password reset for ${email}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a temporary password for {email}. The user can sign in immediately with it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`reset-password-${userId}`}>New password</Label>
            <Input
              id={`reset-password-${userId}`}
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`confirm-password-${userId}`}>Confirm password</Label>
            <Input
              id={`confirm-password-${userId}`}
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={reset} disabled={loading || !password || !confirmPassword}>
            {loading ? "Saving…" : "Reset password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
