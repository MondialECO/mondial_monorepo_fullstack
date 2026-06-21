import { ProposalsContracts } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "Proposals | Mondial",
  description: "Manage Service Provider proposals, contracts, and escrow gates.",
};

export default function ServiceProviderProposalsPage() {
  return <ProposalsContracts />;
}
