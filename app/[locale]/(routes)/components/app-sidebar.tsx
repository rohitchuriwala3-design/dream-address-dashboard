"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { FolderKanban, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NexusPermission } from "@/lib/authz/permission-catalog";
import { canSeeNavigationModule } from "@/lib/authz/navigation";
import { NavMain } from "./nav-main";
import type { NavItem } from "./nav-main";
import { NavUser } from "./nav-user";
import getDashboardMenuItem from "./menu-items/Dashboard";
import getCrmMenuItem from "./menu-items/Crm";
import getProjectsMenuItem from "./menu-items/Projects";
import getEmailsMenuItem from "./menu-items/Emails";
import getReportsMenuItem from "./menu-items/Reports";
import getDocumentsMenuItem from "./menu-items/Documents";
import getInvoicesMenuItem from "./menu-items/Invoices";
import getAdministrationMenuItem from "./menu-items/Administration";
import getCampaignsMenuItem from "./menu-items/Campaigns";
import { partnerNavItems } from "@/lib/partner-routes";

/**
 * AppSidebar Component - Task Groups 1.2, 2.2-2.7, 3.1, 5.3, 5.4
 *
 * Core sidebar component for NextCRM application layout.
 * Implements shadcn/ui sidebar pattern with:
 * - MARK IV branding symbol
 * - Build version display in footer (when expanded)
 * - Navigation with Dashboard and module items
 * - Nav-user section in footer for user profile and actions
 *
 * Phase 2 Updates:
 * - Task 2.2: Added Dashboard menu item integration
 * - Task 2.3: Added CRM module navigation (collapsible group with module filtering)
 * - Task 2.4: Added Projects module navigation (simple item with module filtering)
 * - Task 2.5: Added Emails module navigation (simple item with module filtering)
 * - Task 2.6: Added remaining module navigation items (Employees, Reports, Documents, Databox)
 * - Task 2.7: Added Administration menu with role-based visibility (role === "admin")
 * - NavMain component renders all enabled module navigation items
 * - Module filtering ensures only enabled modules appear in navigation
 * - Role-based visibility: Administration only shows for admin users
 *
 * Phase 3 Updates:
 * - Task 3.1: Added NavUser component in SidebarFooter
 * - NavUser displays user avatar, name, email
 * - NavUser provides dropdown with user actions (Profile, Settings, Logout)
 * - NavUser adapts to collapsed/expanded sidebar states
 * - Build version moved above NavUser in footer
 *
 * Phase 5 Updates (Design Consistency):
 * - Task 5.3: Removed duration-200 from app name animation (uses Tailwind default)
 * - Task 5.3: Kept duration-500 on "N" symbol for intentional brand emphasis
 * - Task 5.4: Changed build version text-gray-500 to text-muted-foreground for theme support
 *
 * @param modules - Array of enabled modules from system_Modules_Enabled table
 * @param dict - Localization dictionary for navigation labels
 * @param build - Build number for version display
 * @param session - User session data for role-based navigation and user profile
 */

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  userStatus?: string;
  userLanguage?: string;
  lastLoginAt?: Date;
}

interface Session {
  user: User;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  dict: any;
  session: Session;
  pluginNav?: { title: string; url: string }[];
  permissions?: readonly NexusPermission[];
  appName: string;
}

export function AppSidebar({
  dict,
  session,
  pluginNav,
  permissions = [],
  appName,
  ...props
}: AppSidebarProps) {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  const role = session?.user?.role;
  const canSee = (module: Parameters<typeof canSeeNavigationModule>[2]) =>
    canSeeNavigationModule(role, permissions, module);
  const navItems: NavItem[] = [];

  if (canSee("dashboard")) navItems.push(getDashboardMenuItem({ title: dict?.dashboard || "Dashboard" }));
  if (canSee("crm")) {
    navItems.push(getCrmMenuItem({ localizations: dict.crm, role: role ?? undefined }));
    navItems.push(getCampaignsMenuItem({
      localizations: {
        title: "Campaigns",
        campaigns: "All Campaigns",
        templates: "Templates",
        targets: "Targets",
        targetLists: "Target Lists",
      },
    }));
  }
  if (canSee("projects")) navItems.push(getProjectsMenuItem({ title: dict?.projects || "Projects" }));
  if (canSee("projects")) navItems.push({ title: "Studio projects", url: "/studio-projects", icon: FolderKanban });
  if (canSee("emails")) navItems.push(getEmailsMenuItem({ title: dict?.emails || "Emails" }));
  if (canSee("reports")) navItems.push(getReportsMenuItem({ title: dict?.reports || "Reports" }));
  if (canSee("documents")) navItems.push(getDocumentsMenuItem({ title: dict?.documents || "Documents" }));
  if (canSee("finance")) navItems.push(getInvoicesMenuItem({ title: dict?.invoices || "Invoices", canViewFinance: true }));

  if (canSee("plugins") && pluginNav?.length) {
    navItems.push({ title: dict?.plugins || "Plugins", icon: Puzzle, items: pluginNav });
  }

  // Administration: admin users only
  if (role === "admin") {
    navItems.push(
      getAdministrationMenuItem({ title: dict?.settings || "Administration" }),
    );
  }

  // Prepare user data for NavUser component
  const userData = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Header with Logo and Branding */}
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center py-1",
            isExpanded ? "gap-x-4" : "justify-center",
          )}
        >
          {/* MARK IV platform monogram */}
          <div
            className={cn(
              "flex-shrink-0 border rounded-full px-4 py-2 transition-transform duration-500",
              isExpanded && "rotate-[360deg]",
            )}
          >
            M4
          </div>

          {/* App Name - visible when expanded, hidden when collapsed */}
          <h1
            className={cn(
              "origin-left font-medium text-xl transition-all overflow-hidden whitespace-nowrap",
              !isExpanded ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            {appName}
          </h1>
        </div>
      </SidebarHeader>

      {/* Main Content - Navigation */}
      <SidebarContent>
        {/* NavMain component with all enabled module navigation items */}
        <NavMain
          items={role === "partner" ? partnerNavItems(navItems) : navItems}
          dict={dict}
        />
      </SidebarContent>

      {/* Footer with NavUser and Build Version */}
      <SidebarFooter>
        {/* Task 3.1: NavUser component with user profile and actions */}
        <NavUser
          user={userData}
          canAccessCrm={canSee("crm")}
          canAccessProjects={canSee("projects")}
        />
      </SidebarFooter>

      {/* Rail for toggling sidebar on desktop */}
      <SidebarRail />
    </Sidebar>
  );
}
