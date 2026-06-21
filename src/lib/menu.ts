import { UserRole } from "./roles";
import {
  LayoutDashboard,
  Lightbulb,
  Users,
  Settings,
  Wallet,
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
  Layers,
  Brain,
  DollarSign,
  GitFork,
  Store,
  Lock,
  Bell,
  Folder,
  FileText,
  PackageCheck,
  Send,
  Timer,
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
          label: "AI Masterplan",
          href: "/dashboard/creator/ai-masterplan",
          icon: Brain,
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
          label: "Messenger",
          href: "/dashboard/creator/messenger",
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
          href: "/dashboard/entrepreneur/deals",
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
      title: "Main",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard/serviceprovider",
          icon: LayoutDashboard,
        },
        {
          label: "Provider Profile",
          href: "/dashboard/serviceprovider/profile",
          icon: BadgeCheck,
        },
        {
          label: "Verification",
          href: "/dashboard/serviceprovider/phase-2",
          icon: ShieldCheck,
        },
        {
          label: "My Services",
          href: "/dashboard/serviceprovider/services",
          icon: PackageCheck,
        },
      ],
    },
    {
      title: "Work",
      items: [
        {
          label: "Leads",
          href: "/dashboard/serviceprovider/leads",
          icon: Users,
        },
        {
          label: "Briefs",
          href: "/dashboard/serviceprovider/briefs",
          icon: FileText,
        },
        {
          label: "Proposals",
          href: "/dashboard/serviceprovider/proposals",
          icon: Send,
        },
        {
          label: "Projects",
          href: "/dashboard/serviceprovider/projects",
          icon: Timer,
        },
        {
          label: "Messenger",
          href: "/dashboard/serviceprovider/messenger",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "Growth",
      items: [
        {
          label: "Earnings",
          href: "/dashboard/serviceprovider/earnings",
          icon: Wallet,
        },
        {
          label: "Analytics",
          href: "/dashboard/serviceprovider/analytics",
          icon: BarChart3,
        },
        {
          label: "Tier & Reputation",
          href: "/dashboard/serviceprovider/tier",
          icon: TrendingUp,
        },
        {
          label: "Notifications",
          href: "/dashboard/serviceprovider/notifications",
          icon: Bell,
        },
        {
          label: "Settings",
          href: "/dashboard/serviceprovider/settings",
          icon: Settings,
        },
      ],
    },
  ],
};
