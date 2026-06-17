import type { ServiceProviderProfile } from "@/types/service-provider";

// Admin moderation contracts. Mirror the backend PendingProviderResponse
// (ServiceProviderDtos.cs): user identity + the full reused profile projection,
// so the queue list and detail drawer render from a single fetch.

export interface PendingProvider {
  userId: string;
  name?: string | null;
  email?: string | null;
  profile: ServiceProviderProfile;
}
