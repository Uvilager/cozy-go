"use client"; // Assuming interaction like ModeToggle or UserNav needs client-side JS

"use client"; // Navbar now uses hooks, needs to be client component

import React from "react";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle"; // Corrected path
import { DropdownMenuWithAvatar } from "./user-nav";
import { CheckSquare } from "lucide-react";
// import { useAuthStore } from "@/store/authStore"; // Remove auth store import
import { useUser } from "@/hooks/useAuth"; // Import useUser hook
import { Button } from "@/components/ui/button"; // Import Button for Login/Signup

export function Navbar() {
  // Use useUser hook to determine auth status for rendering
  // We don't need the user data directly here, just the status
  const { isSuccess: isAuthenticated, isLoading } = useUser();
  // Note: useLogout is now called within DropdownMenuWithAvatar

  // Avoid rendering auth-dependent parts during initial load/query
  const renderAuthSection = () => {
    if (isLoading) {
      // Optional: Render a loading skeleton for the auth section
      return (
        <div className="flex items-center space-x-2 animate-pulse">
          <div className="h-9 w-20 bg-muted rounded"></div>
          <div className="h-9 w-20 bg-muted rounded"></div>
        </div>
      );
    }
    if (isAuthenticated) {
      return <DropdownMenuWithAvatar />; // Render user nav if authenticated
    } else {
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
  };

  return (
    <header className="flex justify-center sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo/Title */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <CheckSquare className="h-6 w-6" /> {/* Example Icon */}
          <span className="font-bold sm:inline-block">Cozy Tasks</span>
        </Link>

        {/* Main Navigation (Optional - can add more links here) */}
        <nav className="flex items-center gap-4 text-sm lg:gap-6">
          <Link
            href="/tasks"
            className="transition-colors hover:text-foreground/80 text-foreground/60" // Example styling for active/inactive
          >
            Tasks
          </Link>
          <Link
            href="/calendar"
            className="transition-colors hover:text-foreground/80 text-foreground/60" // Example styling
          >
            Calendar
          </Link>
          {/* Add other main links like "/dashboard", "/reports" if needed */}
        </nav>

        {/* Right Aligned Items */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {renderAuthSection()}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
