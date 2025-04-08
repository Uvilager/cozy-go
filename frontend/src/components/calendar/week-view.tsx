"use client";

import React from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils"; // For conditional classes

interface WeekViewProps {
  currentDate: Date; // Typically the first day of the week to display
  // Add props for events, event handlers etc. later
}

export default function WeekView({ currentDate }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Assuming Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

  return (
    <div className="flex flex-col h-full">
      {/* Week Header (Days) */}
      <div className="grid grid-cols-[auto_repeat(7,1fr)] sticky top-0 bg-background z-10 border-b">
        {/* Top-left corner spacer */}
        <div className="py-2 border-r"></div>
        {/* Day Headers */}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="text-center font-medium text-sm py-1 border-r last:border-r-0"
          >
            {format(day, "EEE")} {/* Mon, Tue, etc. */}
            <div
              className={cn(
                "text-lg font-semibold",
                isToday(day) && "text-blue-600"
              )}
            >
              {format(day, "d")} {/* 1, 2, etc. */}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable Body (Time Slots & Events) */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[auto_repeat(7,1fr)]">
          {/* Time Column */}
          <div className="row-span-full">
            {hours.map((hour) => (
              <div
                key={`time-${hour}`}
                className="h-12 text-right pr-2 text-xs text-muted-foreground border-r border-b flex items-center justify-end"
              >
                {format(new Date(0, 0, 0, hour), "ha")} {/* 12AM, 1AM, etc. */}
              </div>
            ))}
          </div>

          {/* Event Grid Cells */}
          {days.map((day) => (
            <div key={`day-col-${day.toISOString()}`} className="relative">
              {hours.map((hour) => (
                <div
                  key={`cell-${day.toISOString()}-${hour}`}
                  className="h-12 border-b border-r last:border-r-0"
                  // Add onClick handler here later for creating events
                >
                  {/* Event rendering logic for this day/hour slot will go here */}
                </div>
              ))}
              {/* Absolutely positioned events for this day could be placed here */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
