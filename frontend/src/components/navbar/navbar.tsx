"use client"; // Assuming interaction like ModeToggle or UserNav needs client-side JS

"use client"; // Navbar now uses hooks, needs to be client component

import React from "react";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle"; // Corrected path
import { DropdownMenuWithAvatar } from "./user-nav";
import { CheckSquare } from "lucide-react";
import { useAuthStore } from "@/store/authStore"; // Import auth store
import { useLogout } from "@/hooks/useAuth"; // Import logout hook
import { Button } from "@/components/ui/button"; // Import Button for Login/Signup

export function Navbar() {
  // Get auth state and logout action
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useLogout();

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
          {/* Add other main links like "/dashboard", "/reports" if needed */}
        </nav>

        {/* Right Aligned Items */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isAuthenticated ? (
            <DropdownMenuWithAvatar onLogout={logout} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
