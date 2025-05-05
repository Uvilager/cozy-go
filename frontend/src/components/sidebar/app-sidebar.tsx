"use client"; // Make this a client component

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation"; // Import useSearchParams
import {
  BookOpen,
  Bot,
  // Command, // Remove unused Command icon
  CheckSquare, // Add CheckSquare for logo and Tasks
  Calendar as CalendarIcon, // Rename imported icon to avoid conflict
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  ChevronsUpDownIcon,
} from "lucide-react";
import Link from "next/link"; // Add Link for buttons
import { useUser } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/navbar/mode-toggle";
// Remove Calendar imports, they are now in CalendarNav
// import { Calendar } from "@/components/ui/calendar";
// import { useCalendarStore } from "@/store/calendarStore";
import { CalendarNav } from "./calendar/calendar-nav"; // Adjusted path
import { MultiCalendarSelector } from "@/components/sidebar/calendar/multi-calendar-selector"; // Import MultiCalendarSelector with new name/path

import { NavMain } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup, // Import SidebarGroup
  SidebarGroupLabel, // Import SidebarGroupLabel
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Remove hardcoded data object
// const data = { ... };

// Keep the separate definitions below for secondary nav and projects
const navSecondaryData = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
];

const projectsData = [
  {
    name: "Design Engineering",
    url: "#",
    icon: Frame,
  },
  {
    name: "Sales & Marketing",
    url: "#",
    icon: PieChart,
  },
  {
    name: "Travel",
    url: "#",
    icon: Map,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname(); // Get current path
  const searchParams = useSearchParams(); // Get search params
  const isCalendarPage = pathname.startsWith("/calendar"); // Check if it's the calendar page

  // Calculate dynamic calendar href
  const calendarHref = isCalendarPage
    ? `${pathname}?${searchParams.toString()}` // Preserve params if on calendar page
    : "/calendar"; // Base path otherwise

  const { data: user, isLoading, isError, error } = useUser(); // Fetch user data

  // Define main nav data inside the component to use dynamic href
  const navMainData = [
    // Add Tasks and Calendar links
    {
      title: "Tasks",
      url: "/tasks", // Link to tasks page
      icon: CheckSquare, // Use CheckSquare icon
    },
    {
      title: "Calendar",
      url: calendarHref, // Use dynamic href
      icon: CalendarIcon, // Use renamed Calendar icon
    },
    // Keep existing playground/models etc. or remove if not needed
    // {
    //   title: "Playground",
    //   url: "#",
    //   icon: SquareTerminal,
    //   // isActive: true, // Remove isActive or manage dynamically
    //   items: [
    //     {
    //       title: "History",
    //       url: "#",
    //     },
    //     {
    //       title: "Starred",
    //       url: "#",
    //     },
    //     {
    //       title: "Settings",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Models",
    //   url: "#",
    //   icon: Bot,
    //   items: [
    //     {
    //       title: "Genesis",
    //       url: "#",
    //     },
    //     {
    //       title: "Explorer",
    //       url: "#",
    //     },
    //     {
    //       title: "Quantum",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Documentation",
    //   url: "#",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "Introduction",
    //       url: "#",
    //     },
    //     {
    //       title: "Get Started",
    //       url: "#",
    //     },
    //     {
    //       title: "Tutorials",
    //       url: "#",
    //     },
    //     {
    //       title: "Changelog",
    //       url: "#",
    //     },
    //   ],
    // },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ]; // Correctly close the navMainData array

  // Remove calendar-specific state and handlers
  // const { currentDate, setCurrentDate } = useCalendarStore();
  // const [miniCalMonth, setMiniCalMonth] = React.useState<Date>(currentDate);
  // React.useEffect(() => { ... });
  // const handleDateSelect = (date: Date | undefined) => { ... };

  // Handle error state - log it for now
  if (isError) {
    console.error("Error fetching user for sidebar:", error);
    // Optionally render something different or rely on parent layout
  }

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              {/* Update header to Cozy Tasks logo/link */}
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <CheckSquare className="size-4" />{" "}
                  {/* Use CheckSquare logo */}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Cozy Tasks</span>{" "}
                  {/* Update title */}
                  {/* <span className="truncate text-xs">Enterprise</span> */}{" "}
                  {/* Remove subtitle or adjust */}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Use defined data variables */}
        <NavMain items={navMainData} />

        {/* Conditionally Render CalendarNav and MultiCalendarSelector */}
        {isCalendarPage && (
          <>
            <CalendarNav />
            <MultiCalendarSelector />
          </>
        )}

        {/* Conditionally Render standard NavProjects only if NOT on calendar page */}
        {!isCalendarPage && <NavProjects projects={projectsData} />}

        <NavSecondary items={navSecondaryData} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {/* Conditionally render NavUser based on user fetch state */}
        {isLoading ? (
          // Loading Skeleton similar to old user-nav
          <SidebarMenu>
            <SidebarMenuItem>
              <Button
                variant="ghost" // Use ghost variant for sidebar context
                className="h-12 w-full justify-start px-2 data-[collapsed=true]:justify-center data-[collapsed=true]:px-0 data-[collapsed=true]:py-0 animate-pulse"
                disabled
              >
                <Avatar className="h-8 w-8 rounded-lg bg-muted data-[collapsed=true]:h-6 data-[collapsed=true]:w-6">
                  <AvatarFallback className="rounded-lg">...</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight ml-2 data-[collapsed=true]:hidden">
                  <span className="h-4 bg-muted rounded w-20"></span>
                  <span className="h-3 bg-muted rounded w-28 mt-1"></span>
                </div>
                <ChevronsUpDownIcon className="text-muted-foreground ml-auto size-4 data-[collapsed=true]:hidden" />
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : user ? (
          // Render NavUser if user data is available
          <NavUser user={user} />
        ) : // Render nothing or a placeholder if error or no user (and not loading)
        // Depending on auth flow, this might indicate logged out state
        null}
        {/* Login/Register/ModeToggle moved back to layout2.tsx header */}
      </SidebarFooter>
    </Sidebar>
  );
}
