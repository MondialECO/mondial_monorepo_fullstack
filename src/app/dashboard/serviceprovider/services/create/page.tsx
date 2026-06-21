import { ServiceBuilder } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "Create Service | Mondial",
  description: "Create a Service Provider marketplace service.",
};

export default function CreateServicePage() {
  return <ServiceBuilder />;
}
