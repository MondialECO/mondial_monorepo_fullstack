import type { RoleOption } from "./RoleCard";
import { UserRole } from "@/lib/roles";

/**
 * Role catalogue for the /signup/role picker. Order and copy match the
 * Figma design (file 5oHxoppTAyS4zb2DfUdYwy node 21512:42899). `id` must
 * be the backend UserRole value so it can be passed straight through to
 * /signup.
 */
export const SIGNUP_ROLES: RoleOption[] = [
  {
    id: UserRole.CREATOR,
    name: "Creator",
    description: "I want to build a new project",
    avatar: "/profiles/creator.png",
  },
  {
    id: UserRole.ENTREPRENEUR,
    name: "Entrepreneur",
    description: "I want to scale a verified business",
    avatar: "/profiles/entrepreneur.png",
  },
  {
    id: UserRole.INVESTOR,
    name: "Investor",
    description: "I want to fund impactful projects",
    avatar: "/profiles/investor.png",
  },
  {
    id: UserRole.SERVICE_PROVIDER,
    name: "Service Provider",
    description: "I want to offer my expertise",
    avatar: "/profiles/service.png",
  },
];
