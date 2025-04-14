"use client";

import React from "react";
import { format } from "date-fns";

interface DayViewProps {
  currentDate: Date; // The specific day to display
  // Add props for events, event handlers etc. later
}

export default function DayView({ currentDate }: DayViewProps) {
  // Generate time slots for the day (e.g., hourly)
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

  return (
    // Ensure this component fills the height provided by its parent in CalendarPage
    <div className="flex flex-col h-full">
      {/* Removed outer padding/margin/border - apply within page if needed */}
      {/* Header for the day - could be part of CalendarHeader or kept here */}
      {/* <h2 className="text-lg font-semibold mb-4 text-center p-4 border-b">
        {format(currentDate, "EEEE, MMMM d, yyyy")}
      </h2> */}
      {/* Scrollable time grid area */}
      <div className="flex-1 overflow-auto p-4">
        {" "}
        {/* Add padding here if desired */}
        <div className="relative grid grid-cols-[auto_1fr] gap-x-2">
          {/* Time column */}
          <div className="flex flex-col sticky top-0 bg-background z-10">
            {" "}
            {/* Make time sticky */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 text-right pr-2 text-xs text-muted-foreground border-b flex items-center justify-end"
              >
                {format(new Date(0, 0, 0, hour), "ha")} {/* 12AM, 1AM, etc. */}
              </div>
            ))}
          </div>
          {/* Event area */}
          <div className="relative border-l">
            {hours.map((hour) => (
              <div key={hour} className="h-12 border-b">
                {/* Event rendering logic for this hour slot will go here */}
              </div>
            ))}
            {/* Absolutely positioned events could be placed here */}
          </div>
        </div>
      </div>
    </div>
  );
}
