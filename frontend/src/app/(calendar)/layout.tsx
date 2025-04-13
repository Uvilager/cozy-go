import React from "react";
import Sidebar from "../../components/calendar/sidebar"; // We will create this next

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Use h-full to fill the height provided by the parent main layout's <main> tag
    // Use flex-1 if the parent <main> is also a flex container
    // overflow-hidden might be needed here or on the child page depending on structure
    <div className="flex h-full bg-background">
      <Sidebar />
      {/* This div should contain the scrollable content area */}
      <div className="flex-1 flex flex-col ">
        {/* Changed overflow-auto to hidden */}
        {/* The actual page content (children) should handle its own scrolling */}
        {/* Remove padding from here, apply it within the page if needed */}
        <main className="flex-1 overflow-auto">{children}</main>{" "}
        {/* Allow vertical scroll on main content */}
      </div>
    </div>
  );
}
