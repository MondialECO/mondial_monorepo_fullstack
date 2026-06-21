import { EarningsAnalytics } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "Analytics | Mondial",
  description: "Track Service Provider analytics and growth.",
};

export default function ServiceProviderAnalyticsPage() {
  return <EarningsAnalytics mode="analytics" />;
}
