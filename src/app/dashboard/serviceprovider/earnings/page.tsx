import { EarningsAnalytics } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "Earnings | Mondial",
  description: "Track Service Provider earnings and payouts.",
};

export default function ServiceProviderEarningsPage() {
  return <EarningsAnalytics mode="earnings" />;
}
