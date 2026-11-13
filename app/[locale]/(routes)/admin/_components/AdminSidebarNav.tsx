"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Key, Users, Settings, SlidersHorizontal, ClipboardList, Coins, FileText, CalendarClock, Puzzle, Tags, ShoppingCart, Sheet, Building2 } from "lucide-react";

const navItems = [
  { label: "LLM Keys",     href: "/admin/llm-keys",     icon: Key },
  { label: "Users",        href: "/admin/users",        icon: Users },
  { label: "Business Profile", href: "/admin/business-profile", icon: Building2 },
  { label: "Services",     href: "/admin/services",     icon: Settings },
  { label: "CRM Settings", href: "/admin/crm-settings", icon: SlidersHorizontal },
  { label: "Funnel Settings", href: "/admin/funnel-settings", icon: SlidersHorizontal },
  { label: "Calendar Settings", href: "/admin/calendar-settings", icon: CalendarClock },
  { label: "Audit Log",    href: "/admin/audit-log",    icon: ClipboardList },
  { label: "Google Sheets", href: "/admin/integrations/sheets", icon: Sheet },
  { label: "Currencies",   href: "/admin/currencies",   icon: Coins },
  { label: "Pricing",      href: "/admin/pricing",      icon: Tags },
  { label: "Orders",       href: "/admin/orders",       icon: ShoppingCart },
  { label: "Invoices",     href: "/admin/invoices",     icon: FileText },
  { label: "Plugins",      href: "/admin/plugins",      icon: Puzzle },
];

export function AdminSidebarNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const horizontal = orientation === "horizontal";

  return (
    <nav aria-label="Administration sections" className={horizontal ? "min-w-0 overflow-x-auto" : "flex flex-col gap-1"}>
      <div className={horizontal ? "flex min-w-max items-center gap-1 pb-1" : "flex flex-col gap-1"}>
      <p className={horizontal
        ? "sticky left-0 z-10 bg-card px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        : "px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"}>
        Admin
      </p>
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname.endsWith(href) || pathname.includes(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              horizontal && "whitespace-nowrap",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
