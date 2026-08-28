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
          label: "Provider Verifications",
          href: "/dashboard/admin/serviceproviders",
          icon: ShieldCheck,
        },
        {
          label: "Dispute Resolution",
          href: "/dashboard/admin/disputes",
          icon: Gavel,
        },
      ],
    },
  ],

  [UserRole.CREATOR]: [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
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
      title: "Build Your Project",
      items: [
        {
          label: "Project Studio",
          href: "/dashboard/creator/project-studio",
          icon: Layers,
        },
        {
          label: "Offer & Pricing",
          href: "/dashboard/creator/offer-pricing",
          icon: DollarSign,
        },
        {
          label: "Marketplace Push",
          href: "/dashboard/creator/crossroads",
          icon: Store,
        },
        {
          label: "Growth & Readiness",
          href: "/dashboard/creator/investors",
          icon: Sparkles,
        },
      ],
    },

    {
      title: "Deals & Network",
      items: [
        {
          label: "My Partnerships",
          href: "/dashboard/creator/partnerships",
          icon: Handshake,
        },
        {
          label: "My Sales",
          href: "/dashboard/creator/sales",
          icon: DollarSign,
        },
        {
          label: "Services Marketplace",
          href: "/marketplace/services",
          icon: Store,
        },
        {
          label: "My Engagements",
          href: "/dashboard/creator/engagements",
          icon: Handshake,
        },
      ],
    },

    {
      title: "Communication",
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
      ],
    },

    {
      title: "Assets & Settings",
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
          label: "Settings",
          href: "/dashboard/creator/settings",
          icon: Settings,
        },
      ],
    },
  ],

  // Investor sidebar mirrors the live functional areas:
  // Main (Dashboard, Discovery) / Investment & Deals (Pipeline, Deals, Thesis) / Network & Services (Services, Engagements) / Profile & Communication (Profile, Messages).
  [UserRole.INVESTOR]: [
    {
      title: "Main",
      items: [
        {
          label: "Investments Dashboard",
          href: "/dashboard/investor",
          icon: Wallet,
        },
        {
          label: "Discover Opportunities",
          href: "/dashboard/investor/discovery",
          icon: Compass,
        },
      ],
    },
    {
      title: "Investment & Deals",
      items: [
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
          label: "Services Marketplace",
          href: "/marketplace/services",
          icon: Store,
        },
        {
          label: "My Engagements",
          href: "/dashboard/investor/engagements",
          icon: Handshake,
        },
      ],
    },
    {
      title: "Profile & Communication",
      items: [
        {
          label: "Public Profile",
          href: "/dashboard/investor/profile",
          icon: User,
        },
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
      ],
    },
  ],

  // Entrepreneur sidebar mirrors the live functional areas:
  // Main (Dashboard, Discover, Project Deals, My Acquisitions) / Operations (Financials, Cap Table, Services) / Funding & Matching (Ask, Data Room, Matching, Investor Deals) / Communication (Messages).
  [UserRole.ENTREPRENEUR]: [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard/entrepreneur",
          icon: LayoutDashboard,
        },
        {
          label: "Discover Projects",
          href: "/dashboard/entrepreneur/discover",
          icon: Compass,
        },
        {
          label: "Project Deals",
          href: "/dashboard/entrepreneur/deals",
          icon: GitFork,
        },
        {
          label: "My Acquisitions",
          href: "/dashboard/entrepreneur/acquisitions",
          icon: DollarSign,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: "Financials & KPIs",
          href: "/dashboard/entrepreneur/phase-3",
          icon: BarChart3,
        },
        {
          label: "KPI Tracker",
          href: "/dashboard/entrepreneur/phase-3/kpi-tracker",
          icon: TrendingUp,
        },
        {
          label: "Equity & Cap Table",
          href: "/dashboard/entrepreneur/phase-4",
          icon: PieChart,
        },
        {
          label: "Services Marketplace",
          href: "/marketplace/services",
          icon: Store,
        },
        {
          label: "My Engagements",
          href: "/dashboard/entrepreneur/engagements",
          icon: Handshake,
        },
      ],
    },
    {
      title: "Funding & Matching",
      items: [
        {
          label: "Funding Ask",
          href: "/dashboard/entrepreneur/phase-5",
          icon: TrendingUp,
        },
        {
          label: "Data Room",
          href: "/dashboard/entrepreneur/phase-6",
          icon: FolderOpen,
        },
        {
          label: "AI Review",
          href: "/dashboard/entrepreneur/phase-7",
          icon: Sparkles,
        },
        {
          label: "Investor Matching",
          href: "/dashboard/entrepreneur/phase-8",
          icon: Handshake,
        },
        {
          label: "Investor Deals",
          href: "/dashboard/entrepreneur/phase-9",
          icon: Users,
        },
      ],
    },
    {
      title: "Communication",
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
      ],
    },
  ],

  [UserRole.SERVICE_PROVIDER]: [
    {
      title: "Dashboard",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard/serviceprovider",
          icon: LayoutDashboard,
        },
        {
          label: "Services Marketplace",
          href: "/marketplace/services",
          icon: Store,
        },
        {
          label: "My Engagements",
          href: "/dashboard/serviceprovider/engagements",
          icon: Handshake,
        },
        {
          label: "Profile & Trust",
          href: "/dashboard/serviceprovider/profile",
          icon: BadgeCheck,
        },
        {
          label: "Client Briefs",
          href: "/dashboard/serviceprovider/leads?view=leads",
          icon: FileText,
        },
        {
          label: "Pipeline",
          href: "/dashboard/serviceprovider/leads?view=proposals",
          icon: GitFork,
        },
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
          label: "Service Catalog",
          href: "/dashboard/serviceprovider/services",
          icon: LayoutGrid,
        },
        {
          label: "Analytics & Growth",
          href: "/dashboard/serviceprovider/analytics",
          icon: BarChart3,
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
      ],
    },
  ],
};
