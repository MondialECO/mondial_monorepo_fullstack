import { LeadsAndBriefs } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "Leads | Mondial",
  description: "Review qualified Service Provider ecosystem leads.",
};

export default function ServiceProviderLeadsPage() {
  return <LeadsAndBriefs mode="leads" />;
}
