"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  parseISO,
  getHours, // Import getHours
} from "date-fns";
import { cn } from "@/lib/utils";
// TODO: Verify paths
import { useEvents } from "@/hooks/useEvents"; // Import event hook
import { Event } from "@/lib/api/events"; // Import Event type
import EventDetailDialog from "./event-detail-dialog"; // Import event dialog

interface WeekViewProps {
  currentDate: Date;
  onTimeSlotClick?: (date: Date) => void; // Callback for clicking an empty slot
  calendarIds: number[]; // Changed from projectIds
}

export default function WeekView({
  currentDate,
  onTimeSlotClick,
  calendarIds, // Use calendarIds
}: WeekViewProps) {
  // --- Calculate Time Range ---
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // --- Data Fetching ---
  // Fetch events for the current week using the updated hook
  const {
    data: events,
    isLoading,
    error,
  } = useEvents(calendarIds, weekStart, weekEnd);

  // --- State for Event Detail/Edit ---
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // Use Event type
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Remove duplicate weekEnd declaration
  // const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // --- Group events by DATE and then by START HOUR ---
  const eventsByHourAndDay = useMemo(() => {
    const grouped: Record<string, Record<number, Event[]>> = {}; // Use Event type
    if (!events) return grouped; // Use events data

    events.forEach((event) => {
      // Iterate over events
      // Use start_time for grouping events
      if (event.start_time) {
        try {
          const dateObj = parseISO(event.start_time); // Use event.start_time
          const dateKey = format(dateObj, "yyyy-MM-dd");
          const startHour = getHours(dateObj); // Get hour directly from parsed date

          if (!grouped[dateKey]) {
            grouped[dateKey] = {};
          }
          // Group all events by hour, including those potentially starting at 00:00
          if (!grouped[dateKey][startHour]) {
            grouped[dateKey][startHour] = [];
          }
          grouped[dateKey][startHour].push(event); // Push event

          // Sort events within the hour by start time
          grouped[dateKey][startHour].sort((a, b) => {
            // Assuming start_time is always present here based on outer check
            const timeA = parseISO(a.start_time).getTime();
            const timeB = parseISO(b.start_time).getTime();
            return timeA - timeB;
          });

          // TODO: Handle all-day events (events without start_time or spanning full days) separately if needed
        } catch (e) {
          console.error(
            "Error parsing event start_time for grouping:",
            event.start_time,
            e
          );
        }
      }
    });
    return grouped;
  }, [events]); // Depend on events

  // Rename and update handler for clicking an event
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event); // Use setSelectedEvent
    setIsDetailOpen(true);
  };

  // Update loading/error messages
  if (isLoading)
    return <div className="p-4 text-center">Loading events...</div>;
  if (error)
    return (
      <div className="p-4 text-center text-destructive">
        Error loading events: {error.message}
      </div>
    );

  return (
    <>
      {" "}
      {/* Fragment for Dialog */}
      <div className="flex flex-col h-full">
        {/* Week Header */}
        <div className="grid grid-cols-[auto_repeat(7,1fr)] sticky top-0 bg-background z-10 border-b">
          <div className="py-2 border-r"></div> {/* Spacer */}
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="text-center font-medium text-sm py-1 border-r last:border-r-0"
            >
              {format(day, "EEE")}
              <div
                className={cn(
                  "text-lg font-semibold",
                  isToday(day) && "text-blue-600"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[auto_repeat(7,1fr)]">
            {/* Time Column */}
            <div className="row-span-full">
              {hours.map((hour) => (
                <div
                  key={`time-${hour}`}
                  className="h-12 text-right pr-2 text-xs text-muted-foreground border-r border-b flex items-center justify-end"
                >
                  {format(new Date(0, 0, 0, hour), "ha")}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              // Use eventsByHourAndDay
              const eventsForDay = eventsByHourAndDay[dayKey] || {};

              return (
                <div
                  key={`day-col-${day.toISOString()}`}
                  className="relative border-r last:border-r-0"
                >
                  {/* Render hour slots and events within them */}
                  {hours.map((hour) => {
                    // Use eventsForDay
                    const eventsInHour = eventsForDay[hour] || [];
                    return (
                      <div
                        key={`cell-${day.toISOString()}-${hour}`}
                        className="h-12 border-b cursor-pointer hover:bg-accent/50 relative p-1 space-y-0.5 overflow-hidden" // Add relative and padding/overflow
                        onClick={() => {
                          const clickedDateTime = new Date(day);
                          clickedDateTime.setHours(hour, 0, 0, 0);
                          onTimeSlotClick?.(clickedDateTime);
                        }}
                      >
                        {/* Render events starting in this hour */}
                        {eventsInHour.map(
                          (
                            event // Iterate over events
                          ) => (
                            <div
                              key={event.id} // Use event.id
                              className="group relative flex items-center text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded px-1 truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/60" // Adjusted styling
                              title={event.title} // Use event.title
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event); // Use handleEventClick
                              }}
                            >
                              {/* Remove Priority Indicator */}
                              {/* Time */}
                              <span className="mr-1 flex-shrink-0">
                                {" "}
                                {/* Display event time */}
                                {event.start_time
                                  ? format(parseISO(event.start_time), "HH:mm")
                                  : "All Day"}
                              </span>
                              {/* Title */}
                              <span className="flex-grow truncate">
                                {" "}
                                {/* Display event title */}
                                {event.title}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                  {/* Removed the separate absolute positioned task rendering div */}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Render the Event Detail Dialog */}
      <EventDetailDialog // Use EventDetailDialog
        event={selectedEvent} // Pass selectedEvent
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        // Pass other necessary props
      />
    </>
  );
}
