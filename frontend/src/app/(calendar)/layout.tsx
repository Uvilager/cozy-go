import React from "react";
import Sidebar from "../../components/calendar/sidebar"; // We will create this next

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header will likely go inside the page or a nested layout */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
