"use client";

import React from "react";
import { Calendar } from "@/components/ui/calendar"; // Import shadcn calendar
// Import Project Picker
import { ProjectPicker } from "@/components/projects/project-picker"; // Adjust path if needed

export default function Sidebar() {
  const [month, setMonth] = React.useState<Date>(new Date()); // State for mini-calendar month
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    number | undefined
  >(undefined); // State for selected project

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    console.log("Mini-calendar date selected:", date);
    // TODO: Implement logic to navigate main calendar view
    // This likely requires lifting state up or using a context/store
    setMonth(date); // Update mini-calendar display for now
  };

  const handleProjectChange = (projectId: number | undefined) => {
    console.log("Sidebar: Project selected:", projectId);
    setSelectedProjectId(projectId);
    // TODO: Implement logic to update the main calendar view based on the selected project
    // This likely requires lifting state up or using a context/store
  };

  return (
    <aside className="w-64 border-r p-4 hidden md:block">
      {" "}
      {/* Hide on small screens */}
      <h2 className="text-lg font-semibold mb-4">Calendar Nav</h2>
      {/* Mini Calendar */}
      <div className="mb-6">
        <Calendar
          mode="single"
          selected={month} // Highlight selected day (or keep it simple for now)
          onSelect={handleDateSelect}
          month={month} // Control the displayed month
          onMonthChange={setMonth} // Allow user to change month in mini-calendar
          className="rounded-md border p-0" // Adjust padding/border as needed
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
          selectedProjectId={selectedProjectId} // Pass current selection (optional for picker)
          onProjectChange={handleProjectChange} // Pass the handler
        />
        {/* Remove placeholder */}
      </div>
      {/* Add other sidebar elements if needed */}
    </aside>
  );
}
