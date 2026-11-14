"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setUserOrganization } from "@/actions/admin/users/set-user-organization";

type OrgUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  userStatus: string;
  accessLevelId: string | null;
  reportsToId: string | null;
};
type AccessLevel = { id: string; name: string; slug: string; rank: number };

export function OrganizationalAssignments({ users, levels }: { users: OrgUser[]; levels: AccessLevel[] }) {
  const router = useRouter();
  const defaultDesignation = (user: OrgUser) => {
    const slug = user.role === "admin" ? "administrator" : user.role === "manager" ? "manager" : user.role === "partner" ? "external-partner" : "associate";
    return levels.find((level) => level.slug === slug)?.id ?? "";
  };
  const [values, setValues] = useState<Record<string, { levelId: string; reportsToId: string }>>(() =>
    Object.fromEntries(users.map((user) => [user.id, { levelId: user.accessLevelId ?? defaultDesignation(user), reportsToId: user.reportsToId ?? "none" }])),
  );
  const [saving, setSaving] = useState<string | null>(null);
  const internalUsers = users.filter((user) => user.role !== "partner" && user.userStatus === "ACTIVE");

  const update = async (user: OrgUser) => {
    const value = values[user.id];
    if (!value?.levelId) return toast.error("Choose a designation first.");
    setSaving(user.id);
    const result = await setUserOrganization(user.id, value.levelId, value.reportsToId === "none" ? null : value.reportsToId);
    setSaving(null);
    if (result.error) return toast.error(result.error);
    toast.success("Designation and reporting line saved.");
    router.refresh();
  };

  return (
    <section className="space-y-4 rounded-lg border p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Team hierarchy</h2>
        <p className="mt-1 text-sm text-muted-foreground">Set each staff member’s designation and reporting manager. CRM visibility follows the reporting tree: Associates see their own assigned records, managers see their configured team, and Founders see company-wide CRM records.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b text-left text-muted-foreground"><th className="p-2 font-medium">Team member</th><th className="p-2 font-medium">Designation</th><th className="p-2 font-medium">Reports to</th><th className="p-2" /></tr></thead>
          <tbody>
            {users.filter((user) => user.role !== "partner").map((user) => {
              const value = values[user.id] ?? { levelId: user.accessLevelId ?? defaultDesignation(user), reportsToId: user.reportsToId ?? "none" };
              const ownRank = levels.find((level) => level.id === value.levelId)?.rank ?? -1;
              const eligibleManagers = internalUsers.filter((candidate) => candidate.id !== user.id && (levels.find((level) => level.id === candidate.accessLevelId)?.rank ?? -1) > ownRank);
              return (
                <tr className="border-b last:border-0" key={user.id}>
                  <td className="p-2"><div className="font-medium">{user.name || "Unnamed profile"}</div><div className="text-xs text-muted-foreground">{user.email}</div></td>
                  <td className="w-[220px] p-2"><Select value={value.levelId} onValueChange={(levelId) => setValues((current) => ({ ...current, [user.id]: { ...value, levelId, reportsToId: eligibleManagers.some((person) => person.id === value.reportsToId) ? value.reportsToId : "none" } }))}><SelectTrigger><SelectValue placeholder="Choose designation" /></SelectTrigger><SelectContent>{levels.map((level) => <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>)}</SelectContent></Select></td>
                  <td className="w-[240px] p-2"><Select value={value.reportsToId} onValueChange={(reportsToId) => setValues((current) => ({ ...current, [user.id]: { ...value, reportsToId } }))}><SelectTrigger><SelectValue placeholder="No reporting manager" /></SelectTrigger><SelectContent><SelectItem value="none">No reporting manager</SelectItem>{eligibleManagers.map((manager) => <SelectItem key={manager.id} value={manager.id}>{manager.name || manager.email} · {levels.find((level) => level.id === manager.accessLevelId)?.name ?? "Unassigned"}</SelectItem>)}</SelectContent></Select></td>
                  <td className="p-2 text-right"><Button size="sm" variant="outline" disabled={saving === user.id || !value.levelId} onClick={() => void update(user)}>{saving === user.id ? "Saving…" : "Save"}</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
