"use client";

import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { adminUserSchema } from "../table-data/schema";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/modals/alert-modal";
import { useState } from "react";
import { toast } from "sonner";

import { Building2, Copy, KeyRound, MoreHorizontal, Shield, ShieldCheck, Trash, UserCheck, UserX } from "lucide-react";
import { deleteUser } from "@/actions/admin/users/delete-user";
import { activateUser } from "@/actions/admin/users/activate-user";
import { deactivateUser } from "@/actions/admin/users/deactivate-user";
import { revokeUserApiTokens } from "@/actions/admin/users/revoke-api-tokens";
import { PartnerAccountDialog } from "../components/partner-account-dialog";
import { ResetUserPasswordDialog } from "../components/reset-user-password-dialog";
import { ProfilePermissionsDialog } from "../components/profile-permissions";
import { ChangeRoleDialog } from "../components/change-role-dialog";
import { parseRole } from "@/lib/authz/roles";
import type { AppRole } from "@/lib/authz/roles";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const data = adminUserSchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [partnerAccountOpen, setPartnerAccountOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [nextRole, setNextRole] = useState<AppRole>(parseRole(data.role) ?? "user");
  const [loading, setLoading] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("The URL has been copied to your clipboard.");
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      const result = await deleteUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been deleted");
    } catch (error) {
      toast.error("Something went wrong: " + error + ". Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onActivate = async () => {
    try {
      setLoading(true);
      const result = await activateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been activated.");
    } catch (error) {
      toast.error("Something went wrong while activating user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDeactivate = async () => {
    try {
      setLoading(true);
      const result = await deactivateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been deactivated.");
    } catch (error) {
      toast.error("Something went wrong while deactivating user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRevokeTokens = async () => {
    try {
      setLoading(true);
      const result = await revokeUserApiTokens(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Revoked ${result.data?.revoked ?? 0} API token(s).`);
    } catch (error) {
      toast.error("Something went wrong while revoking API tokens. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      {data.role === "partner" && (
        <PartnerAccountDialog
          userId={data.id}
          partnerAccountId={data.partnerAccountId ?? null}
          open={partnerAccountOpen}
          onOpenChange={setPartnerAccountOpen}
        />
      )}
      <ResetUserPasswordDialog
        userId={data.id}
        email={data.email}
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
      />
      <ProfilePermissionsDialog userId={data.id} email={data.email} initialPermissions={data.permissionKeys ?? []} open={permissionsOpen} onOpenChange={setPermissionsOpen} />
      <ChangeRoleDialog
        userId={data.id}
        userName={data.name || data.email}
        email={data.email}
        currentRole={parseRole(data.role) ?? "user"}
        role={nextRole}
        onRoleChange={setNextRole}
        open={roleOpen}
        onOpenChange={setRoleOpen}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onCopy(data?.id)}>
            <Copy className="mr-2 w-4 h-4" />
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onActivate()}>
            <UserCheck className="mr-2 w-4 h-4" />
            Activate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDeactivate()}>
            <UserX className="mr-2 w-4 h-4" />
            Deactivate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRevokeTokens()}>
            <KeyRound className="mr-2 w-4 h-4" />
            Revoke API tokens
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
            <KeyRound className="mr-2 w-4 h-4" />
            Reset password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPermissionsOpen(true)}>
            <ShieldCheck className="mr-2 w-4 h-4" />
            Edit permissions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setNextRole(parseRole(data.role) ?? "user"); setRoleOpen(true); }}>
            <Shield className="mr-2 w-4 h-4" />
            Change access role
          </DropdownMenuItem>
          {data.role === "partner" && (
            <DropdownMenuItem onClick={() => setPartnerAccountOpen(true)}>
              <Building2 className="mr-2 w-4 h-4" />
              Partner account
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
