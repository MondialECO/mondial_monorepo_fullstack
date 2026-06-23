import api from "@/lib/axios";
import type {
  InvestorProfile,
  UpdateInvestorProfileInput,
} from "@/types/investor/profile";

// Typed wrappers over the investor self-service profile endpoints
// (GET/PUT /api/investor/profile). Errors propagate to TanStack Query.

export async function getInvestorProfile(): Promise<InvestorProfile> {
  const res = await api.get<InvestorProfile>("/investor/profile");
  return res.data;
}

export async function updateInvestorProfile(
  input: UpdateInvestorProfileInput
): Promise<InvestorProfile> {
  const res = await api.put<InvestorProfile>("/investor/profile", input);
  return res.data;
}
