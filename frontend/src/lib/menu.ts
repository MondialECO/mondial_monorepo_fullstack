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
  Layers,
  Brain,
  DollarSign,
  GitFork,
  Store,
  Lock,
  MessageSquare,
  Bell,
  Folder,
  FileText,
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
