import { NotificationsSettings } from "@/components/serviceprovider/ServiceProviderCommandCenter";

export const metadata = {
  title: "Notifications | Mondial",
  description: "Review Service Provider notifications.",
};

export default function ServiceProviderNotificationsPage() {
  return <NotificationsSettings mode="notifications" />;
}
