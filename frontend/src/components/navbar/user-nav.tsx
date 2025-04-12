import {
  BadgeCheckIcon,
  BellIcon,
  ChevronsUpDownIcon,
  LogOut,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link"; // Import Link
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
// import { useAuthStore } from "@/store/authStore"; // Remove auth store import
import { useUser, useLogout } from "@/hooks/useAuth"; // Import useUser and useLogout hooks

interface DropdownMenuWithAvatarProps {
  // onLogout prop is no longer needed as we get it from the hook
}

// Helper to get initials from username or email
const getInitials = (name?: string, email?: string): string => {
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      return parts[0][0].toUpperCase();
    }
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?"; // Default fallback
};

export function DropdownMenuWithAvatar() {
  // Remove props
  const { data: user, isLoading, isError, error } = useUser(); // Use the hook
  const onLogout = useLogout(); // Get logout action from hook

  // --- Loading State ---
  if (isLoading) {
    // Render a simplified loading state or skeleton
    return (
      <Button
        variant="outline"
        className="h-12 justify-start px-2 md:max-w-[200px] animate-pulse"
        disabled
      >
        <Avatar className="bg-muted">
          <AvatarFallback className="rounded-lg">...</AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight ml-2">
          <span className="h-4 bg-muted rounded w-20"></span>
          <span className="h-3 bg-muted rounded w-28 mt-1"></span>
        </div>
        <ChevronsUpDownIcon className="text-muted-foreground ml-auto" />
      </Button>
    );
  }

  // --- Error State ---
  // Decide how to handle errors - log, show message, or maybe rely on parent?
  // If error occurs (e.g., token invalid), parent Navbar might hide this component anyway.
  if (isError) {
    console.error("Error fetching user data for user-nav:", error);
    // Optionally return a fallback or null
    return null; // Or a generic error indicator button
  }

  // --- Success State ---
  // We should have user data here if enabled and successful
  if (!user) {
    // This case might happen briefly or if query is disabled but auth state says logged in
    console.warn(
      "UserNav: No user data available despite query success/enabled state."
    );
    return null; // Or loading/fallback state
  }

  const initials = getInitials(user.username, user.email);
  const displayName = user.username || user.email; // Prefer username if available
  const displayEmail = user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-12 justify-start px-2 md:max-w-[200px]"
        >
          <Avatar>
            {/* TODO: Add actual user avatar URL if available */}
            {/* <AvatarImage src={user.avatarUrl} alt={displayName} /> */}
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{displayName}</span>
            <span className="text-muted-foreground truncate text-xs">
              {displayEmail}
            </span>
          </div>
          <ChevronsUpDownIcon className="text-muted-foreground ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
        align="start"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar>
              {/* <AvatarImage src={user.avatarUrl} alt={displayName} /> */}
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{displayName}</span>
              <span className="text-muted-foreground truncate text-xs">
                {displayEmail}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <SparklesIcon />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheckIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BellIcon />
            Notifications
          </DropdownMenuItem>
          <Link href="/settings" passHref>
            {" "}
            {/* Wrap with Link */}
            <DropdownMenuItem>
              <SettingsIcon />
              Settings
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Add onSelect handler to trigger logout */}
        <DropdownMenuItem onSelect={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> {/* Added spacing */}
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
