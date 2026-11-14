import { redirect } from "next/navigation";

/** Legacy profile dashboard alias; never render its unfinished static template. */
const UserCRMDashboard = () => redirect("/crm");

export default UserCRMDashboard;
