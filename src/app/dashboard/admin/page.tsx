import { RoleWorkspacePage } from "@/components/dashboard/RoleWorkspacePage";

export default function AdminDashboard() {
  return (
    <RoleWorkspacePage
      roleName="Admin"
      heading="Platform Operations Center"
      summary="Monitor activation, maintain trust and compliance controls, and unblock teams from one place."
      readiness={82}
      metrics={[
        { label: "Active users", value: "12,408" },
        { label: "Open alerts", value: "6" },
        { label: "SLA health", value: "99.3%" },
      ]}
      quickActions={[
        {
          label: "User and role governance",
          description: "Review role assignments, permissions, and suspicious activity logs.",
          href: "/dashboard/admin",
        },
        {
          label: "Compliance and trust queue",
          description: "Process verification escalations and keep marketplace trust healthy.",
          href: "/dashboard/admin",
        },
      ]}
      checklist={[
        {
          title: "Review priority alerts",
          hint: "Triage policy violations and security flags before daily standup.",
          status: "in-progress",
        },
        {
          title: "Approve pending workspace access",
          hint: "Ensure least-privilege role access is enforced for new team members.",
          status: "ready",
        },
        {
          title: "Finalize weekly compliance report",
          hint: "Publish audit-ready snapshots for legal and enterprise customers.",
          status: "blocked",
        },
      ]}
    />
  );
}
