import { NotificationsForm } from "@/components/settings/notifications-form";

export default function SettingsNotificationsPage() {
  // The layout file handles the title, description, separator, and sidebar.
  // This page component only needs to render the specific form.
  return <NotificationsForm />;
}
