"use client";

import React from "react";
import { Calendar } from "@/components/ui/calendar"; // Import shadcn calendar
// Import Project Picker using named import
import { ProjectPicker } from "@/components/projects/project-picker"; // Adjust path if needed

interface SidebarProps {
  currentDate: Date; // Current date from parent for mini-calendar month control
  selectedProjectId: number | undefined; // Currently selected project ID from parent
  onNavigateDate: (date: Date) => void; // Callback to change main calendar date
  onProjectChange: (projectId: number | undefined) => void; // Callback to change selected project
}

export default function Sidebar({
  currentDate,
  selectedProjectId,
  onNavigateDate,
  onProjectChange,
}: SidebarProps) {
  // State for the mini-calendar's *displayed* month (can differ from main calendar)
  const [miniCalMonth, setMiniCalMonth] = React.useState<Date>(currentDate);

  // Update mini-calendar month if main calendar date changes significantly
  React.useEffect(() => {
    setMiniCalMonth(currentDate);
  }, [currentDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    console.log("Mini-calendar date selected:", date);
    onNavigateDate(date); // Call parent handler to update main calendar
    // No need to setMiniCalMonth here, parent state change will trigger useEffect
  };

  // Project change is now directly handled by the prop callback
  // const handleProjectChange = (projectId: number | undefined) => { ... }

  return (
    <aside className="w-64 border-r p-4 hidden md:block">
      {" "}
      {/* Hide on small screens */}
      <h2 className="text-lg font-semibold mb-4">Calendar Nav</h2>
      {/* Mini Calendar */}
      <div className="mb-6">
        <Calendar
          mode="single"
          // selected={currentDate} // Highlight the main calendar's date? Or keep local selection? Let's keep it simple for now.
          onSelect={handleDateSelect} // Use the updated handler
          month={miniCalMonth} // Control displayed month with local state
          onMonthChange={setMiniCalMonth} // Allow changing month locally
          className="rounded-md border p-0"
          classNames={{
            // Make it more compact
            caption_label: "text-sm font-medium",
            nav_button: "h-6 w-6",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex w-full mt-2",
            head_cell:
              "w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground",
            row: "flex w-full mt-2",
            cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
      </div>
      {/* Project Picker */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Project</h3>
        <ProjectPicker
          // Pass down the selected project ID (as string) and the change handler
          currentProjectId={selectedProjectId?.toString()}
          onProjectChange={(
            idStr: string | undefined // Add type annotation
          ) => onProjectChange(idStr ? parseInt(idStr, 10) : undefined)}
        />
      </div>
      {/* Add other sidebar elements if needed */}
    </aside>
  );
}
