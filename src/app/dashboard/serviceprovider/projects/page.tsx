import { WorkroomProjects } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "Projects | Mondial",
  description: "Manage Service Provider active projects and workrooms.",
};

export default function ServiceProviderProjectsPage() {
  return <WorkroomProjects />;
}
