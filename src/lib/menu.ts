import { UserRole } from "./roles";
import {
  LayoutDashboard,
  Lightbulb,
  Users,
  User,
  CreditCard,
  Settings,
  Wallet,
  Briefcase,
  BadgeCheck,
  Compass,
  LayoutGrid,
  MessageSquare,
  Handshake,
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
} from "lucide-react";

export type MenuItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
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
          label: "Discovery",
          href: "/dashboard/investor/discovery",
          icon: Compass,
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
          label: "Provider Profile",
          href: "/dashboard/serviceprovider/profile",
          icon: BadgeCheck,
        },
        {
          label: "Services",
          href: "/dashboard/serviceprovider/services",
          icon: LayoutGrid,
        },
        {
          label: "Leads & Proposals",
          href: "/dashboard/serviceprovider/leads",
          icon: Briefcase,
        },
        {
          label: "Workroom",
          href: "/dashboard/serviceprovider/workroom",
          icon: FolderOpen,
        },
        {
          label: "Earnings",
          href: "/dashboard/serviceprovider/earnings",
          icon: Wallet,
        },
        {
          label: "Analytics & Growth",
          href: "/dashboard/serviceprovider/analytics",
          icon: BarChart3,
        },
      ],
    },
  ],
};
