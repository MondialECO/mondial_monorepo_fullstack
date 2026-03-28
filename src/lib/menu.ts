import { UserRole } from "./roles";
import {
  LayoutDashboard,
  Lightbulb,
  Users,
  User,
  CreditCard,
  Settings,
  HelpCircle,
  Wallet,
  Briefcase,
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

    {
      title: "Others",
      items: [
        {
          label: "Help & Support",
          href: "/dashboard/creator/help",
          icon: HelpCircle,
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
      ],
    },
  ],

  [UserRole.SERVICE_PROVIDER]: [
    {
      title: "Dashboard",
      items: [
        {
          label: "Advisory Panel",
          href: "/dashboard/serviceprovider",
          icon: Briefcase,
        },
      ],
    },
  ],
};
