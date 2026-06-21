import { LeadsAndBriefs } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "Client Briefs | Mondial",
  description: "Review Service Provider client briefs.",
};

export default function ServiceProviderBriefsPage() {
  return <LeadsAndBriefs mode="briefs" />;
}
