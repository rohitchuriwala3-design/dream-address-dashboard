"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { inviteUser } from "@/actions/admin/users/invite-user";
import { Checkbox } from "@/components/ui/checkbox";
import { NEXUS_PERMISSIONS, type NexusPermission } from "@/lib/authz/permission-catalog";

const FormSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["user", "manager", "admin", "partner"]),
  language: z
    .string({
      message: "Please select a user language.",
    })
    .min(2),
    permissions: z.array(z.enum(["dashboard.view", "crm.view", "crm.manage", "projects.view", "projects.manage", "finance.view", "finance.manage", "reports.view", "sheets.audit"])),
});

export function InviteForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", email: "", password: "", role: "user", language: "en", permissions: [] },
  });
  const passwordValue = form.watch("password");
  const passwordStrength = passwordValue.length < 8
    ? "Low — use at least 8 characters."
    : passwordValue.length >= 14 && /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue) && /\d/.test(passwordValue) && /[^A-Za-z0-9]/.test(passwordValue)
      ? "Strong"
      : passwordValue.length >= 10 && /[a-zA-Z]/.test(passwordValue) && /\d/.test(passwordValue)
        ? "Fair — a longer, less predictable password is safer."
        : "Low — add length and a mix of letters, numbers, or symbols.";

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    try {
      const result = await inviteUser(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        if (result.warning) toast.warning(result.warning);
        else toast.success("Profile created. Share the temporary password securely.");
        form.reset({ name: "", email: "", password: "", role: "user", language: "en", permissions: [] });
        router.refresh();
      }
    } catch (error) {
      toast.error("Profile creation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid w-full grid-cols-1 items-end gap-4 p-5 md:grid-cols-3 xl:grid-cols-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="jdoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="name@domain.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temporary password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  disabled={isLoading}
                  placeholder="At least 8 characters"
                  {...field}
                />
              </FormControl>
              {passwordValue && <p aria-live="polite" className={`text-xs ${passwordValue.length < 8 ? "text-destructive" : "text-muted-foreground"}`}>Password strength: {passwordStrength}</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="permissions" render={({ field }) => <FormItem className="md:col-span-3 xl:col-span-6">
          <FormLabel>Additional permissions</FormLabel>
          <p className="text-xs text-muted-foreground">Permission rollout is in progress. Existing role-based access remains authoritative until module enforcement is complete.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {NEXUS_PERMISSIONS.map(({ key, label, description }) => <label key={key} htmlFor={`new-user-${key}`} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50">
              <Checkbox id={`new-user-${key}`} checked={field.value.includes(key)} disabled={isLoading} onCheckedChange={(value) => {
                const current = field.value as NexusPermission[];
                field.onChange(value === true ? Array.from(new Set([...current, key])) : current.filter((permission) => permission !== key));
              }} />
              <span className="grid gap-1"><span className="text-sm font-medium">{label}</span><span className="text-xs text-muted-foreground">{description}</span></span>
            </label>)}
          </div>
        </FormItem>} />
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Icons.spinner className="animate-spin" />
          ) : (
            "Create profile"
          )}
        </Button>
      </form>
    </Form>
  );
}
