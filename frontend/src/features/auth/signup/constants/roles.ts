import {
  Briefcase,
  CircleDollarSign,
  Lightbulb,
  Zap,
} from "lucide-react";

export interface Role {
  id: string;
  name: string;
  title: string;
  /** Short subtitle used in the role-selection icon grid. */
  description: string;
  icon: typeof Briefcase;
}

/**
 * Copy + icons map to the Figma role-selection grid (frame 3654).
 */
export const ROLES: Role[] = [
  {
    id: "creator",
    name: "creator",
    title: "Creator",
    description: "Build New Projects",
    icon: Lightbulb,
  },
  {
    id: "entrepreneur",
    name: "entrepreneur",
    title: "Entrepreneur",
    description: "Scale Verified Business",
    icon: Zap,
  },
  {
    id: "investor",
    name: "investor",
    title: "Investor",
    description: "Fund Impact Projects",
    icon: CircleDollarSign,
  },
  {
    id: "service-provider",
    name: "service-provider",
    title: "Service Provider",
    description: "Offer Expert Services",
    icon: Briefcase,
  },
];

export const getRoleById = (id: string): Role | undefined =>
  ROLES.find((role) => role.id === id);

export const getRoleByName = (name: string): Role | undefined =>
  ROLES.find((role) => role.name === name);
