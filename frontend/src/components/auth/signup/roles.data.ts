import type { RoleOption } from "./RoleCard";
import { UserRole } from "@/lib/roles";

/**
 * Role catalogue for the /signup/role picker. `id` must be the backend
 * UserRole value so it can be passed straight through to /signup.
 */
export const SIGNUP_ROLES: RoleOption[] = [
  {
    id: UserRole.ENTREPRENEUR,
    name: "Entrepreneur",
    description:
      "Launch a venture, recruit a team, and raise capital from aligned investors.",
    avatar: "/profiles/entrepreneur.png",
  },
  {
    id: UserRole.INVESTOR,
    name: "Investor",
    description:
      "Discover curated deals, track portfolio performance, and co-invest with peers.",
    avatar: "/profiles/investor.png",
  },
  {
    id: UserRole.CREATOR,
    name: "Creator",
    description:
      "Turn your audience into capital — publish, gate content, and monetize.",
    avatar: "/profiles/creator.png",
  },
  {
    id: UserRole.SERVICE_PROVIDER,
    name: "Service Provider",
    description:
      "Offer legal, design, or growth services to founders in the ecosystem.",
    avatar: "/profiles/service.png",
  },
];
