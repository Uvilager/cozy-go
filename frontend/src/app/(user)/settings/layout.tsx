import { Metadata } from "next";
import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/user/settings/sidebar-nav"; // Import the new sidebar

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

// Define the navigation items for the sidebar
const sidebarNavItems = [
  {
    title: "Profile",
    href: "/settings/profile", // Updated path
  },
  {
    title: "Notifications",
    href: "/settings/notifications", // New path
  },
  // Add other settings sections here later if needed
  // {
  //   title: "Appearance",
  //   href: "/settings/appearance",
  // },
  // {
  //   title: "Display",
  //   href: "/settings/display",
  // },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <>
      {/* Hidden on small screens, block on medium+ */}
      <div className="hidden space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="lg:w-1/5">
            {" "}
            {/* Removed -mx-4 */}
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>{" "}
          {/* Render the specific page content */}
        </div>
      </div>
      {/* TODO: Add layout for smaller screens if needed */}
      <div className="block space-y-6 p-4 pb-16 md:hidden">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          (Layout for smaller screens needed)
        </p>
        {/* Render children directly or use a different layout for mobile */}
        {children}
      </div>
    </>
  );
}
