import { UserRole } from "./roles";
import {
  LayoutDashboard,
  BadgeCheck,
  Lightbulb,
  Users,
  User,
  Settings,
  Wallet,
  Compass,
  LayoutGrid,
  MessageSquare,
  Handshake,
  Gavel,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  BarChart3,
  PieChart,
  FolderOpen,
  TrendingUp,
  Store,
  GitFork,
  DollarSign,
  Folder,
  FileText,
  Bell,
  Lock,
  Layers,
  CheckCircle2,
  UserCheck,
  Building2,
} from "lucide-react";

export type MenuItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: Array<{
    label: string;
    href: string;
  }>;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export const menu: Record<UserRole, MenuSection[]> = {
  [UserRole.ADMIN]: [
    {
      title: "Dashboard",
      items: [
        {
          label: "Admin Overview",
          href: "/dashboard/admin",
          icon: LayoutDashboard,
        },
        {
          label: "Users",
          href: "/dashboard/admin/users",
          icon: Users,
        },
        {
          label: "Verifications",
          href: "/dashboard/admin/verifications",
          icon: ShieldCheck,
          children: [
            {
              label: "Hub Overview",
              href: "/dashboard/admin/verifications",
            },
            {
              label: "Identity / KYC",
              href: "/dashboard/admin/verifications/kyc",
            },
            {
              label: "Service Providers",
              href: "/dashboard/admin/verifications/service-providers",
            },
            {
              label: "Investor Finance",
              href: "/dashboard/admin/verifications/investors",
            },
          ],
        },
        {
          label: "Commerce & Finance",
          href: "/dashboard/admin/commerce",
          icon: DollarSign,
          children: [
            {
              label: "Commerce Overview",
              href: "/dashboard/admin/commerce",
            },
            {
              label: "Engagements",
              href: "/dashboard/admin/engagements",
            },
            {
              label: "Disputes",
              href: "/dashboard/admin/disputes",
            },
            {
              label: "Transactions Ledger",
              href: "/dashboard/admin/transactions",
            },
            {
              label: "Payout Requests",
              href: "/dashboard/admin/payouts",
            },
          ],
        },
        {
          label: "Marketplace & Content",
          href: "/dashboard/admin/marketplace",
          icon: Store,
          children: [
            {
              label: "Overview",
              href: "/dashboard/admin/marketplace",
            },
            {
              label: "Services",
              href: "/dashboard/admin/marketplace/services",
            },
            {
              label: "Creator Offers",
              href: "/dashboard/admin/marketplace/creator-offers",
            },
            {
              label: "Reviews",
              href: "/dashboard/admin/reviews",
            },
          ],
        },
        {
          label: "Reports & Abuse",
          href: "/dashboard/admin/reports",
          icon: ShieldAlert,
        },
        {
          label: "Audit Logs",
          href: "/dashboard/admin/audit",
          icon: FileText,
        },
        {
          label: "Governance",
          href: "/dashboard/admin/governance",
          icon: ShieldCheck,
        },
      ],
    },
  ],

  [UserRole.SUPERADMIN]: [
    {
      title: "Dashboard",
      items: [
        {
          label: "Admin Overview",
          href: "/dashboard/admin",
          icon: LayoutDashboard,
        },
        {
          label: "Users",
          href: "/dashboard/admin/users",
          icon: Users,
        },
        {
          label: "Verifications",
          href: "/dashboard/admin/verifications",
          icon: ShieldCheck,
          children: [
            {
              label: "Hub Overview",
              href: "/dashboard/admin/verifications",
            },
            {
              label: "Identity / KYC",
              href: "/dashboard/admin/verifications/kyc",
            },
            {
              label: "Service Providers",
              href: "/dashboard/admin/verifications/service-providers",
            },
            {
              label: "Investor Finance",
              href: "/dashboard/admin/verifications/investors",
            },
          ],
        },
        {
          label: "Commerce & Finance",
          href: "/dashboard/admin/commerce",
          icon: DollarSign,
          children: [
            {
              label: "Summary",
              href: "/dashboard/admin/commerce",
            },
            {
              label: "Escrows & Milestones",
              href: "/dashboard/admin/escrows",
            },
            {
              label: "Disputes Hub",
              href: "/dashboard/admin/disputes",
            },
            {
              label: "Transactions Ledger",
              href: "/dashboard/admin/transactions",
            },
            {
              label: "Payout Requests",
              href: "/dashboard/admin/payouts",
            },
            {
              label: "Commission & Tiers",
              href: "/dashboard/admin/commission",
            },
            {
              label: "Engagements & Orders",
              href: "/dashboard/admin/engagements",
            },
          ],
        },
        {
          label: "Marketplace Moderation",
          href: "/dashboard/admin/marketplace",
          icon: Store,
          children: [
            {
              label: "Moderation Summary",
              href: "/dashboard/admin/marketplace",
            },
            {
              label: "Services",
              href: "/dashboard/admin/marketplace/services",
            },
            {
              label: "Creator Offers",
              href: "/dashboard/admin/marketplace/creator-offers",
            },
            {
              label: "Reviews",
              href: "/dashboard/admin/reviews",
            },
          ],
        },
        {
          label: "Reports & Abuse",
          href: "/dashboard/admin/reports",
          icon: ShieldAlert,
        },
        {
          label: "Audit Logs",
          href: "/dashboard/admin/audit",
          icon: FileText,
        },
        {
          label: "Governance",
          href: "/dashboard/admin/governance",
          icon: ShieldCheck,
        },
        {
          label: "Security & Compliance",
          href: "/dashboard/admin/security",
          icon: Lock,
          children: [
            {
              label: "Security Overview",
              href: "/dashboard/admin/security",
            },
            {
              label: "Security Events",
              href: "/dashboard/admin/security/events",
            },
            {
              label: "Privacy Requests",
              href: "/dashboard/admin/privacy/requests",
            },
            {
              label: "Compliance Cases",
              href: "/dashboard/admin/compliance",
            },
            {
              label: "Data Governance",
              href: "/dashboard/admin/data-governance",
            },
          ],
        },
        {
          label: "System & Operations",
          href: "/dashboard/admin/system",
          icon: Settings,
          children: [
            {
              label: "Overview",
              href: "/dashboard/admin/system",
            },
            {
              label: "Health",
              href: "/dashboard/admin/system/health",
            },
            {
              label: "Jobs",
              href: "/dashboard/admin/system/jobs",
            },
            {
              label: "Notifications",
              href: "/dashboard/admin/system/notifications",
            },
            {
              label: "Queues",
              href: "/dashboard/admin/system/queues",
            },
            {
              label: "Platform Controls",
              href: "/dashboard/admin/system/controls",
            },
          ],
        },
      ],
    },
  ],

  [UserRole.CREATOR]: [
    {
      title: "Dashboard",
      items: [
        {
          label: "Overview",
          href: "/dashboard/creator",
          icon: LayoutDashboard,
        },
        {
          label: "My Ideas",
          href: "/dashboard/creator/myideas",
          icon: Lightbulb,
        },
      ],
    },
    {
      title: "Project Builder",
      items: [
        {
          label: "Project Studio",
          href: "/dashboard/creator/project-studio",
          icon: Layers,
        },
        {
          label: "Pricing & Equity",
          href: "/dashboard/creator/offer-pricing",
          icon: DollarSign,
        },
        {
          label: "Growth & Readiness",
          href: "/dashboard/creator/investors",
          icon: Sparkles,
        },
      ],
    },
    {
      title: "Project Marketplace",
      items: [
        {
          label: "Project Marketplace",
          href: "/dashboard/creator/marketplace",
          icon: Store,
        },
        {
          label: "Launch to Market",
          href: "/dashboard/creator/crossroads",
          icon: Compass,
        },
        {
          label: "Partnerships",
          href: "/dashboard/creator/partnerships",
          icon: Handshake,
        },
        {
          label: "Project Sales",
          href: "/dashboard/creator/sales",
          icon: DollarSign,
        },
      ],
    },
    {
      title: "Assets & IP",
      items: [
        {
          label: "Documents",
          href: "/dashboard/creator/documents",
          icon: FileText,
        },
        {
          label: "Asset Library",
          href: "/dashboard/creator/asset-library",
          icon: Folder,
        },
        {
          label: "IP Vault",
          href: "/dashboard/creator/ip-vault",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "Services & Network",
      items: [
        {
          label: "Hire Services",
          href: "/marketplace/services",
          icon: Store,
        },
        {
          label: "Active Engagements",
          href: "/dashboard/creator/engagements",
          icon: Handshake,
        },
      ],
    },
    {
      title: "Communication & Account",
      items: [
        {
          label: "Messages",
          href: "/dashboard/creator/messages",
          icon: MessageSquare,
        },
        {
          label: "Notifications",
          href: "/dashboard/creator/notifications",
          icon: Bell,
        },
        {
          label: "Profile",
          href: "/dashboard/profile",
          icon: User,
        },
        {
          label: "Settings",
          href: "/dashboard/creator/settings",
          icon: Settings,
        },
      ],
    },
  ],

  [UserRole.INVESTOR]: [
    {
      title: "Dashboard",
      items: [
        {
          label: "Overview",
          href: "/dashboard/investor",
          icon: LayoutDashboard,
        },
        {
          label: "Portfolio",
          href: "/dashboard/investor/portfolio",
          icon: Wallet,
        },
      ],
    },
    {
      title: "Dealmaking & Pipeline",
      items: [
        {
          label: "Discover Opportunities",
          href: "/dashboard/investor/discovery",
          icon: Compass,
        },
        {
          label: "Pipeline",
          href: "/dashboard/investor/pipeline",
          icon: LayoutGrid,
        },
        {
          label: "Deals & Term Sheets",
          href: "/dashboard/investor/deals",
          icon: Handshake,
        },
        {
          label: "Investment Thesis",
          href: "/dashboard/investor/thesis",
          icon: BadgeCheck,
        },
      ],
    },
    {
      title: "Services & Network",
      items: [
        {
          label: "Hire Services",
          href: "/marketplace/services",
          icon: Store,
        },
        {
          label: "Active Engagements",
          href: "/dashboard/investor/engagements",
          icon: Handshake,
        },
      ],
    },
    {
      title: "Communication & Account",
      items: [
        {
          label: "Messages",
          href: "/dashboard/investor/messages",
          icon: MessageSquare,
        },
        {
          label: "Notifications",
          href: "/dashboard/investor/notifications",
          icon: Bell,
        },
        {
          label: "Verification",
          href: "/dashboard/investor/phase-2",
          icon: ShieldCheck,
        },
        {
          label: "Profile",
          href: "/dashboard/profile",
          icon: User,
        },
      ],
    },
  ],

  [UserRole.ENTREPRENEUR]: [
    {
      title: "Dashboard",
      items: [
        {
          label: "Overview",
          href: "/dashboard/entrepreneur",
          icon: LayoutDashboard,
        },
        {
          label: "My Companies",
          href: "/dashboard/entrepreneur/companies",
          icon: Building2,
        },
      ],
    },
    {
      title: "Venture Operations",
      items: [
        {
          label: "Financials & KPIs",
          href: "/dashboard/entrepreneur/phase-3/kpi-tracker",
          icon: BarChart3,
        },
        {
          label: "Cap Table & Equity",
          href: "/dashboard/entrepreneur/phase-4",
          icon: PieChart,
        },
        {
          label: "Data Room",
          href: "/dashboard/entrepreneur/phase-6",
          icon: FolderOpen,
        },
      ],
    },
    {
      title: "Fundraising & Deals",
      items: [
        {
          label: "Funding Ask",
          href: "/dashboard/entrepreneur/phase-5",
          icon: TrendingUp,
        },
        {
          label: "Investor Matching",
          href: "/dashboard/entrepreneur/phase-8",
          icon: Handshake,
        },
        {
          label: "Deals & Term Sheets",
          href: "/dashboard/entrepreneur/deals",
          icon: Users,
        },
      ],
    },
    {
      title: "Opportunity Market",
      items: [
        {
          label: "Discover Projects",
          href: "/dashboard/entrepreneur/discover",
          icon: Compass,
        },
        {
          label: "My Acquisitions",
          href: "/dashboard/entrepreneur/acquisitions",
          icon: DollarSign,
        },
      ],
    },
    {
      title: "Services & Network",
      items: [
        {
          label: "Hire Services",
          href: "/marketplace/services",
          icon: Store,
        },
        {
          label: "Active Engagements",
          href: "/dashboard/entrepreneur/engagements",
          icon: Handshake,
        },
      ],
    },
    {
      title: "Communication & Account",
      items: [
        {
          label: "Messages",
          href: "/dashboard/entrepreneur/messages",
          icon: MessageSquare,
        },
        {
          label: "Notifications",
          href: "/dashboard/entrepreneur/notifications",
          icon: Bell,
        },
        {
          label: "Profile",
          href: "/dashboard/profile",
          icon: User,
        },
      ],
    },
  ],

  [UserRole.SERVICE_PROVIDER]: [
    {
      title: "Dashboard",
      items: [
        {
          label: "Overview",
          href: "/dashboard/serviceprovider",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Client Leads & Pipeline",
      items: [
        {
          label: "Client Briefs & Leads",
          href: "/dashboard/serviceprovider/leads?view=leads",
          icon: FileText,
        },
        {
          label: "Proposals & Pipeline",
          href: "/dashboard/serviceprovider/leads?view=proposals",
          icon: GitFork,
        },
      ],
    },
    {
      title: "Client Workroom",
      items: [
        {
          label: "Active Projects",
          href: "/dashboard/serviceprovider/workroom?view=active",
          icon: FolderOpen,
        },
        {
          label: "Completed Projects",
          href: "/dashboard/serviceprovider/workroom?view=completed",
          icon: CheckCircle2,
        },
      ],
    },
    {
      title: "Business & Earnings",
      items: [
        {
          label: "My Service Catalog",
          href: "/dashboard/serviceprovider/services",
          icon: LayoutGrid,
        },
        {
          label: "Earnings & Payouts",
          href: "/dashboard/serviceprovider/earnings?tab=activity",
          icon: Wallet,
          children: [
            { label: "Earnings Overview", href: "/dashboard/serviceprovider/earnings?tab=activity" },
            { label: "Payouts", href: "/dashboard/serviceprovider/earnings?tab=payouts" },
            { label: "Financial Settings", href: "/dashboard/serviceprovider/earnings?tab=settings" },
          ],
        },
        {
          label: "Analytics & Growth",
          href: "/dashboard/serviceprovider/analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Communication & Account",
      items: [
        {
          label: "Messages",
          href: "/dashboard/serviceprovider/messages",
          icon: MessageSquare,
        },
        {
          label: "Notifications",
          href: "/dashboard/serviceprovider/notifications",
          icon: Bell,
        },
        {
          label: "Verification",
          href: "/dashboard/serviceprovider/phase-1",
          icon: ShieldCheck,
        },
        {
          label: "Profile",
          href: "/dashboard/profile",
          icon: User,
        },
      ],
    },
  ],
};
