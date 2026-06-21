import { NotificationsSettings } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "Settings | Mondial",
  description: "Manage Service Provider settings.",
};

export default function ServiceProviderSettingsPage() {
  return <NotificationsSettings mode="settings" />;
}
