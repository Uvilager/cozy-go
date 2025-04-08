"use client";

import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
} from "date-fns";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  currentDate: Date; // First day of the month to display
  // Add props for events, event handlers etc. later
}

// Helper to get days for the calendar grid
const getCalendarDays = (monthDate: Date) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Week starts Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: startDate, end: endDate });
};

export default function MonthView({ currentDate }: MonthViewProps) {
  const daysInGrid = getCalendarDays(currentDate);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // Adjust if week starts Sunday

  return (
    <div className="flex flex-col h-full p-4">
      {/* Days of the week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1">
        {daysInGrid.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "border rounded-md p-1 flex flex-col",
              !isSameMonth(day, currentDate) &&
                "bg-muted/50 text-muted-foreground", // Dim days outside current month
              isToday(day) && "bg-blue-100 dark:bg-blue-900" // Highlight today
            )}
            // Add onClick handler here later
          >
            <span
              className={cn(
                "text-xs self-end",
                isToday(day) && "text-blue-700 dark:text-blue-300 font-bold"
              )}
            >
              {format(day, "d")}
            </span>
            <div className="flex-1 overflow-hidden mt-1">
              {/* Event rendering logic for this day will go here */}
              {/* Example placeholder: */}
              {/* <div className="text-xs bg-green-200 rounded px-1 truncate">Event 1</div> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
