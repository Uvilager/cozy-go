import React from "react";

// This layout is now very simple, just providing the basic structure
// It should remain a Server Component by default
export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render children directly. The page component will handle the actual UI layout (Sidebar + Content)
  // We still need a container to maintain the flex layout defined in the root Layout's main tag
  return <div className="flex flex-1 h-full overflow-hidden">{children}</div>;
}
