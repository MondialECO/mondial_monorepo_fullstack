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
          label: "Services Marketplace",
          href: "/marketplace/services",
          icon: Store,
        },
        {
          label: "My Engagements",
          href: "/dashboard/creator/engagements",
          icon: Handshake,
        },
        {
          label: "My Idea",
          href: "/dashboard/creator/myideas",
          icon: Lightbulb,
        },
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
      ],
    },

    {
      title: "Growth",
      items: [
        {
          label: "The Crossroads",
          href: "/dashboard/creator/crossroads",
          icon: GitFork,
        },
        {
          label: "Marketplace",
          href: "/dashboard/creator/marketplace",
          icon: Store,
        },
        {
          label: "Hire Providers",
          href: "/dashboard/creator/hire-providers",
          icon: Users,
        },
        {
          label: "IP Vault",
          href: "/dashboard/creator/ip-vault",
          icon: Lock,
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
      title: "Assets",
      items: [
        {
          label: "Asset Library",
          href: "/dashboard/creator/asset-library",
          icon: Folder,
        },
        {
          label: "Documents",
          href: "/dashboard/creator/documents",
          icon: FileText,
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
          label: "Investments",
          href: "/dashboard/investor",
          icon: Wallet,
        },
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
        {
          label: "Discovery",
          href: "/dashboard/investor/discovery",
          icon: Compass,
        },
        {
          label: "Investment Thesis",
          href: "/dashboard/investor/thesis",
          icon: BadgeCheck,
        },
        {
          label: "Public Profile",
          href: "/dashboard/investor/profile",
          icon: User,
        },
        {
          label: "Pipeline",
          href: "/dashboard/investor/pipeline",
          icon: LayoutGrid,
        },
        {
          label: "Deals",
          href: "/dashboard/investor/deals",
          icon: Handshake,
        },
        {
          label: "Messages",
          href: "/dashboard/investor/messages",
          icon: MessageSquare,
        },
      ],
    },
  ],

  // Entrepreneur sidebar mirrors the Figma Dashboard Overview groups
  // (MAIN / FUNDING / MATCHING). Every href points at a route that exists today.
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
          label: "Services Marketplace",
          href: "/marketplace/services",
          icon: Store,
        },
        {
          label: "My Engagements",
          href: "/dashboard/entrepreneur/engagements",
          icon: Handshake,
        },
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
      ],
    },
    {
      title: "Funding",
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
      ],
    },
    {
      title: "Matching",
      items: [
        {
          label: "Investor Matching",
          href: "/dashboard/entrepreneur/phase-8",
          icon: Handshake,
        },
        {
          label: "Deals",
          href: "/dashboard/entrepreneur/phase-9",
          icon: Users,
        },
        {
          label: "Messages",
          href: "/dashboard/entrepreneur/messages",
          icon: MessageSquare,
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
