import { ProfileForm } from "@/components/user/settings/profile-form";

export default function SettingsProfilePage() {
  // The layout file handles the title, description, separator, and sidebar.
  // This page component only needs to render the specific form.
  return <ProfileForm />;
}
