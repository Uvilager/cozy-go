"use client";

import { useState } from "react";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { DropdownMenuWithAvatar } from "./user-nav";
import { CheckSquare, Menu } from "lucide-react";
import { useUser } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const { isSuccess: isAuthenticated, isLoading } = useUser();
  const [open, setOpen] = useState(false);

  // Close the sheet when a navigation link is clicked
  const handleLinkClick = () => {
    setOpen(false);
  };

  // Avoid rendering auth-dependent parts during initial load/query
  const renderAuthSection = () => {
    if (isLoading) {
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

  // Navigation links component to avoid duplication
  const NavLinks = ({ mobile = false, onClick = () => {} }) => (
    <nav
      className={`${
        mobile ? "flex flex-col space-y-4" : "hidden md:flex"
      } items-center gap-4 text-sm lg:gap-6`}
    >
      <Link
        href="/tasks"
        onClick={onClick}
        className="transition-colors hover:text-foreground/80 text-foreground/60"
      >
        Tasks
      </Link>
      <Link
        href="/calendar"
        onClick={onClick}
        className="transition-colors hover:text-foreground/80 text-foreground/60"
      >
        Calendar
      </Link>
    </nav>
  );

  return (
    <header className="flex justify-center sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo/Title */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <CheckSquare className="h-6 w-6" />
          <span className="font-bold sm:inline-block">Cozy Tasks</span>
        </Link>

        {/* Desktop Navigation */}
        <NavLinks />

        {/* Mobile Menu */}
        <div className="md:hidden ml-auto">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col h-full py-6">
                <div className="flex items-center mb-6">
                  <CheckSquare className="h-6 w-6 mr-2" />
                  <span className="font-bold">Cozy Tasks</span>
                </div>

                {/* Mobile Navigation Links */}
                <NavLinks mobile={true} onClick={handleLinkClick} />

                {/* Mobile Auth Section */}
                <div className="mt-auto flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2">
                    {isAuthenticated ? (
                      <div className="py-2">
                        <DropdownMenuWithAvatar />
                      </div>
                    ) : (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleLinkClick}
                        >
                          <Link href="/login">Login</Link>
                        </Button>
                        <Button
                          asChild
                          className="w-full justify-start"
                          onClick={handleLinkClick}
                        >
                          <Link href="/register">Sign Up</Link>
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Theme</span>
                    <ModeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Right Aligned Items - Desktop */}
        <div className="hidden flex-1 items-center justify-end space-x-2 md:flex">
          {renderAuthSection()}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
