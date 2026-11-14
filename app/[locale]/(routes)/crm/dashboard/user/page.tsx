import { redirect } from "next/navigation";

/**
 * Legacy personal dashboard retained as a route alias so bookmarked links do
 * not show its old, fixed-column lead table. The current lead workspace scopes
 * records by the signed-in user's CRM permissions and provides the same
 * customizable table and lead detail view as the main CRM navigation.
 */
const UserDashboardPage = () => redirect("/crm/leads");

export default UserDashboardPage;
