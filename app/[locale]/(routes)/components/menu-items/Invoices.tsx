import { Receipt } from "lucide-react"
import { NavItem } from "../nav-main"

interface GetInvoicesMenuItemProps {
  title: string
  role?: string
}

export default function getInvoicesMenuItem({
  title,
  role,
}: GetInvoicesMenuItemProps): NavItem {
  if (role === "manager" || role === "admin") {
    return {
      title: "Finance",
      icon: Receipt,
      items: [
        { title, url: "/invoices" },
        { title: "Vendor bills", url: "/vendor-bills" },
        { title: "Vendors", url: "/vendors" },
        { title: "Treasury", url: "/treasury" },
      ],
    };
  }
  return {
    title,
    url: "/invoices",
    icon: Receipt,
  }
}
