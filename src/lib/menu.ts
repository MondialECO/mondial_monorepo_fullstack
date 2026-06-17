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
        {
          label: "AI Studio",
          href: "/dashboard/creator/ai",
          icon: Sparkles,
        },
        {
          label: "Investors",
          href: "/dashboard/creator/investors",
          icon: Users,
        },
        {
          label: "Messages",
          href: "/dashboard/creator/messages",
          icon: MessageSquare,
        },
      ],
    },

    {
      title: "Account",
      items: [
        {
          label: "Profile",
          href: "/dashboard/creator/profile",
          icon: User,
        },
        {
          label: "Billing History",
          href: "/dashboard/creator/billinghistory",
          icon: CreditCard,
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
      title: "Dashboard",
      items: [
        {
          label: "Provider Profile",
          href: "/dashboard/serviceprovider/profile",
          icon: BadgeCheck,
        },
      ],
    },
  ],
};
