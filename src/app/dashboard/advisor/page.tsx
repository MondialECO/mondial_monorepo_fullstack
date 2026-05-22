import { RoleWorkspacePage } from "@/components/dashboard/RoleWorkspacePage";

export default function AdvisorDashboard() {
  return (
    <RoleWorkspacePage
      roleName="Advisor"
      heading="Advisory Command Desk"
      summary="Guide founders through milestones, reduce decision friction, and keep each engagement investor-ready."
      readiness={74}
      metrics={[
        { label: "Assigned founders", value: "21" },
        { label: "Pending reviews", value: "9" },
        { label: "On-time sessions", value: "92%" },
      ]}
      quickActions={[
        {
          label: "Today's mentorship queue",
          description: "Prioritize founders blocked in verification, valuation, or fundraising steps.",
          href: "/dashboard/advisor",
        },
        {
          label: "Readiness playbooks",
          description: "Apply standardized guidance for phase transitions and investor handoffs.",
          href: "/dashboard/advisor",
        },
      ]}
      checklist={[
        {
          title: "Complete top 3 phase reviews",
          hint: "Close feedback loops quickly for founders waiting to continue.",
          status: "in-progress",
        },
        {
          title: "Publish advisory notes",
          hint: "Keep a clean activity log that founders and admins can reference.",
          status: "ready",
        },
        {
          title: "Escalate legal blockers",
          hint: "Raise unresolved compliance issues to admin before investor matching.",
          status: "blocked",
        },
      ]}
    />
  );
}
