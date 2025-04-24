"use client";

import React, { useState } from "react"; // Import useState
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
// TODO: Verify path for useEvents hook and Event type
import { useEvents } from "@/hooks/useEvents"; // Import event hook
import { Event } from "@/lib/api/events"; // Import Event type (adjust path if needed)
import EventDetailDialog from "./event-detail-dialog"; // Import event dialog (adjust path if needed)

interface MonthViewProps {
  currentDate: Date; // First day of the month to display
  onDayClick?: (date: Date) => void; // Add callback for clicking a day cell
  calendarIds: number[]; // Changed from projectIds to calendarIds array
}

// Helper to get days for the calendar grid
const getCalendarDays = (monthDate: Date) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Week starts Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: startDate, end: endDate });
};

export default function MonthView({
  currentDate,
  onDayClick,
  calendarIds, // Use calendarIds prop
}: MonthViewProps) {
  // --- Calculate Time Range for the Grid ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStartDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Week starts Monday
  const gridEndDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // --- Data Fetching ---
  // Pass calendarIds and the calculated time range to the hook
  const {
    data: events,
    isLoading,
    error,
  } = useEvents(calendarIds, gridStartDate, gridEndDate); // Fetch events

  // --- State for Event Detail/Edit ---
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // Use Event type
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // --- Calendar Grid Calculation ---
  const daysInGrid = getCalendarDays(currentDate);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // --- Group events by date for easier rendering ---
  // Create a map where key is date string (YYYY-MM-DD) and value is array of events
  const eventsByDate = React.useMemo(() => {
    const grouped: Record<string, Event[]> = {}; // Use Event type
    if (!events) return grouped; // Use events data

    events.forEach((event) => {
      // Iterate over events
      // Use start_time for grouping events. Adjust if needed.
      if (event.start_time) {
        try {
          // TODO: Confirm event.start_time is a valid date string or Date object
          const dateKey = format(new Date(event.start_time), "yyyy-MM-dd");
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(event); // Push event
        } catch (e) {
          console.error("Error parsing event start_time:", event.start_time, e);
        }
      }
      // TODO: Handle events without start_time? Or all-day events?
    });
    return grouped;
  }, [events]); // Dependency is events

  // --- Handler for clicking an event ---
  const handleEventClick = (event: Event) => {
    // Use Event type
    console.log("Event clicked:", event);
    setSelectedEvent(event); // Use setSelectedEvent
    setIsDetailOpen(true);
    // Event Detail Dialog will be rendered below
  };

  // --- Rendering ---
  if (isLoading) {
    // Update loading message
    return <div className="p-4 text-center">Loading events...</div>;
  }
  if (error) {
    // Update error message
    return (
      <div className="p-4 text-center text-destructive">
        Error loading events: {error.message}
      </div>
    );
  }

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
              "border rounded-md p-1 flex flex-col cursor-pointer hover:bg-accent hover:text-accent-foreground", // Add cursor/hover
              !isSameMonth(day, currentDate) &&
                "bg-muted/50 text-muted-foreground", // Dim days outside current month
              isToday(day) && "bg-blue-100 dark:bg-blue-900" // Highlight today
            )}
            onClick={() => onDayClick?.(day)} // Call onDayClick prop when cell is clicked
          >
            <span
              className={cn(
                "text-xs self-end",
                isToday(day) && "text-blue-700 dark:text-blue-300 font-bold"
              )}
            >
              {format(day, "d")}
            </span>
            <div className="flex-1 overflow-y-auto mt-1 space-y-0.5">
              {/* Render events for this day */}
              {(eventsByDate[format(day, "yyyy-MM-dd")] || []).map(
                (
                  event // Use eventsByDate and event
                ) => (
                  <div
                    key={event.id} // Use event.id
                    className="group relative flex items-center text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/60" // Adjusted styling for events
                    title={event.title} // Show full title on hover
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent day click handler when clicking event
                      handleEventClick(event); // Use handleEventClick
                    }}
                  >
                    {/* Remove Priority Indicator */}

                    {/* Time */}
                    <span className="mr-1 flex-shrink-0">
                      {/* TODO: Confirm event.start_time format and handle potential errors */}
                      {
                        event.start_time
                          ? format(new Date(event.start_time), "HH:mm")
                          : "All Day" /* Placeholder for all-day events */
                      }
                    </span>

                    {/* Title */}
                    <span className="flex-grow truncate">{event.title}</span>

                    {/* Remove Task-specific badge */}
                    {/* <Badge variant="secondary" className="absolute right-1 top-1/2 -translate-y-1/2 scale-75 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.label}
                  </Badge> */}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for Task Detail Dialog */}
      {/* {isDetailOpen && selectedTask && (
         <TaskDetailDialog
           task={selectedTask}
           isOpen={isDetailOpen}
           onClose={() => setIsDetailOpen(false)}
           // Pass necessary props like projectId for potential updates/deletions
           projectId={projectId}
         />
       )}

       {/* Render the Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent} // Pass selectedEvent
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        // Pass any other necessary props for the event dialog
      />
    </div>
  );
}
