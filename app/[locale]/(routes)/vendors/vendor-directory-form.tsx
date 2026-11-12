"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVendorAccountAction } from "@/actions/vendor-bills/actions";

export function VendorDirectoryForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  if (!open) return <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4"/>Add vendor</Button>;
  return <form className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(event) => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    startTransition(async () => {
      const result = await createVendorAccountAction(values);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Vendor added"); setOpen(false); router.refresh();
    });
  }}>
    <label className="space-y-1 text-xs font-medium">Vendor name<Input name="name" required minLength={2} maxLength={100}/></label>
    <label className="space-y-1 text-xs font-medium">Email<Input name="email" type="email" maxLength={254}/></label>
    <label className="space-y-1 text-xs font-medium">Phone<Input name="phone" maxLength={50}/></label>
    <label className="space-y-1 text-xs font-medium">City<Input name="city" maxLength={100}/></label>
    <div className="flex items-end gap-2"><Button disabled={pending}>{pending?"Saving…":"Save vendor"}</Button><Button type="button" variant="ghost" onClick={()=>setOpen(false)}>Cancel</Button></div>
  </form>;
}
