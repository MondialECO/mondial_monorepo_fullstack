import { redirect } from "next/navigation";

// The provider profile is the primary Service Provider experience, so the role
// landing route redirects straight to it (Phase 2).
export default function ServiceProviderDashboard() {
  redirect("/dashboard/serviceprovider/profile");
}
