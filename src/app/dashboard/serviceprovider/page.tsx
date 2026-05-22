import { RoleWorkspacePage } from "@/components/dashboard/RoleWorkspacePage";

export default function ServiceProviderDashboard() {
  return (
    <RoleWorkspacePage
      roleName="Service Provider"
      heading="Partner Delivery Workspace"
      summary="Serve founders with clear scopes, reliable turnaround, and audit-ready delivery records."
      readiness={71}
      metrics={[
        { label: "Open client requests", value: "17" },
        { label: "Avg turnaround", value: "2.4 days" },
        { label: "Satisfaction score", value: "4.8/5" },
      ]}
      quickActions={[
        {
          label: "Service request queue",
          description: "Review incoming requests and prioritize deadlines by urgency.",
          href: "/dashboard/serviceprovider",
        },
        {
          label: "Deliverables and invoices",
          description: "Track completed work, billing status, and handoff confirmations.",
          href: "/dashboard/serviceprovider",
        },
      ]}
      checklist={[
        {
          title: "Acknowledge all new requests",
          hint: "Respond within SLA and set delivery expectations immediately.",
          status: "ready",
        },
        {
          title: "Submit evidence for completed tasks",
          hint: "Attach proofs so founders can safely move to the next phase.",
          status: "in-progress",
        },
        {
          title: "Resolve disputed invoices",
          hint: "Clear finance blockers to protect your provider quality score.",
          status: "blocked",
        },
      ]}
    />
  );
}
