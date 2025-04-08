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
    <div className="p-4 border rounded-md m-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4 text-center">
        {format(currentDate, "EEEE, MMMM d, yyyy")}
      </h2>
      <div className="flex-1 overflow-auto">
        <div className="relative grid grid-cols-[auto_1fr] gap-x-2">
          {/* Time column */}
          <div className="flex flex-col">
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
