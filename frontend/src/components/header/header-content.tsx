"use client"; // Mark HeaderContent as a Client Component

import Link from "next/link"; // Import Link
import { useUser } from "@/hooks/useAuth"; // Import useUser hook for client-side state
import { Button } from "@/components/ui/button"; // Import Button
import { ModeToggle } from "@/components/navbar/mode-toggle"; // Import ModeToggle

// Client component for header content
export function HeaderContent() {
  const { data: user, isLoading } = useUser();

  const renderAuthSection = () => {
    if (isLoading) {
      // Loading state for buttons
      return (
        <div className="flex items-center space-x-2 animate-pulse">
          <div className="h-9 w-20 bg-muted rounded"></div>
          <div className="h-9 w-20 bg-muted rounded"></div>
        </div>
      );
    }
    if (!user) {
      // Render Login/Sign Up if not authenticated
      return (
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Sign Up</Link>
          </Button>
        </>
      );
    }
    // If user is logged in, render nothing here (user info is in sidebar)
    return null;
  };

  return (
    <div className="flex flex-1 items-center justify-end space-x-2">
      {renderAuthSection()}
      <ModeToggle />
    </div>
  );
}
