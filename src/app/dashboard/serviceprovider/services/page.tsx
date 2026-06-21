import { ServicesDashboard } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "My Services | Mondial",
  description: "Manage Service Provider services and analytics.",
};

export default function ServiceProviderServicesPage() {
  return <ServicesDashboard />;
}
