import { RoleWorkspacePage } from "@/components/dashboard/RoleWorkspacePage";

export default function FounderDashboard() {
  return (
    <RoleWorkspacePage
      roleName="Founder"
      heading="Founder Execution Hub"
      summary="Turn strategy into weekly execution, align team priorities, and keep your venture moving toward funding readiness."
      readiness={68}
      metrics={[
        { label: "Active ideas", value: "5" },
        { label: "Milestones this month", value: "14" },
        { label: "Investor intros", value: "3" },
      ]}
      quickActions={[
        {
          label: "Roadmap and milestones",
          description: "Track delivery targets and unblock cross-functional dependencies.",
          href: "/dashboard/founder",
        },
        {
          label: "Funding narrative",
          description: "Refine your story with traction, KPI evidence, and clear use of funds.",
          href: "/dashboard/founder",
        },
      ]}
      checklist={[
        {
          title: "Confirm next milestone owner",
          hint: "Every milestone should have an accountable owner and deadline.",
          status: "ready",
        },
        {
          title: "Update traction dashboard",
          hint: "Publish current KPIs before investor and advisor meetings.",
          status: "in-progress",
        },
        {
          title: "Close outstanding legal documents",
          hint: "Resolve open legal tasks before entering final matching rounds.",
          status: "blocked",
        },
      ]}
    />
  );
}
