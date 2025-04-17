"use client"; // Make this a client component

import * as React from "react";
import { usePathname } from "next/navigation"; // Import usePathname
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
import { Calendar } from "@/components/ui/calendar"; // Import the Calendar component
import { useCalendarStore } from "@/store/calendarStore"; // Import the Zustand store

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

// Define nav data directly or fetch it if needed
const navMainData = [
  // Add Tasks and Calendar links
  {
    title: "Tasks",
    url: "/tasks", // Link to tasks page
    icon: CheckSquare, // Use CheckSquare icon
  },
  {
    title: "Calendar",
    url: "/calendar", // Link to calendar page
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

// Keep the separate definitions below
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
  const isCalendarPage = pathname.startsWith("/calendar"); // Check if it's the calendar page

  const { data: user, isLoading, isError, error } = useUser(); // Fetch user data

  // Zustand state for shared date
  const { currentDate, setCurrentDate } = useCalendarStore();
  // Local state for mini-calendar's displayed month
  const [miniCalMonth, setMiniCalMonth] = React.useState<Date>(currentDate);

  // Sync mini-calendar month with shared date state
  React.useEffect(() => {
    setMiniCalMonth(currentDate);
  }, [currentDate]);

  // Handle date selection from mini-calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setCurrentDate(date); // Update shared state
  };

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

        {/* Conditionally Render Calendar Nav Section */}
        {isCalendarPage && (
          // Add data-[collapsed=true]:hidden to the group itself to hide label too
          <SidebarGroup className="data-[collapsed=true]:hidden">
            <SidebarGroupLabel>Date Nav</SidebarGroupLabel>
            {/* Wrapper to hide calendar when collapsed */}
            <div className="flex justify-center p-2 data-[collapsed=true]:hidden">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDateSelect}
                month={miniCalMonth}
                onMonthChange={setMiniCalMonth}
                className="rounded-md p-0" // Removed border
                classNames={{
                  // Make it more compact
                  caption_label: "text-xs font-medium", // Smaller caption
                  nav_button: "h-5 w-5", // Smaller nav buttons
                  nav_button_previous: "absolute left-1 top-1", // Adjust position
                  nav_button_next: "absolute right-1 top-1", // Adjust position
                  table: "w-full border-collapse space-y-1", // Add space between rows
                  head_row: "flex w-full", // Removed mt-2
                  head_cell:
                    "w-full rounded-md text-[0.7rem] font-normal text-muted-foreground", // Smaller header text, adjusted width
                  row: "flex w-full mt-1", // Smaller margin top
                  cell: "h-8 w-8 text-center text-xs p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20", // Smaller cell size, smaller text
                  day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100", // Smaller day size
                  day_selected:
                    "rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground", // Ensure selected is rounded
                  day_today: "rounded-md bg-accent text-accent-foreground", // Ensure today is rounded
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </SidebarGroup>
        )}

        <NavProjects projects={projectsData} />
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
