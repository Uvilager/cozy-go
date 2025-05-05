"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { useCalendarStore } from "@/store/calendarStore";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

export function CalendarNav() {
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

  return (
    // Add data-[collapsed=true]:hidden to the group itself to hide label too
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
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
  );
}
