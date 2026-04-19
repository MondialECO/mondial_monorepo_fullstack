import type { RoleOption } from "./RoleCard";

/**
 * Default role catalogue for the signup flow.
 * Avatars live under /public/profiles/ (already present).
 */
export const SIGNUP_ROLES: RoleOption[] = [
  {
    id: "entrepreneur",
    name: "Entrepreneur",
    description:
      "Launch a venture, recruit a team, and raise capital from aligned investors.",
    avatar: "/profiles/entrepreneur.png",
  },
  {
    id: "investor",
    name: "Investor",
    description:
      "Discover curated deals, track portfolio performance, and co-invest with peers.",
    avatar: "/profiles/investor.png",
  },
  {
    id: "creator",
    name: "Creator",
    description:
      "Turn your audience into capital — publish, gate content, and monetize.",
    avatar: "/profiles/creator.png",
  },
  {
    id: "service-provider",
    name: "Service Provider",
    description:
      "Offer legal, design, or growth services to founders in the ecosystem.",
    avatar: "/profiles/service.png",
  },
];
