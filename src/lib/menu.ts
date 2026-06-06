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

  [UserRole.ENTREPRENEUR]: [
    {
      title: "Dashboard",
      items: [
        {
          label: "Advisory Panel",
          href: "/dashboard/entrepreneur",
          icon: Briefcase,
        },
        {
          label: "Deals",
          href: "/dashboard/entrepreneur/deals",
          icon: Handshake,
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
