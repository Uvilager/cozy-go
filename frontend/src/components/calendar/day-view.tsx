"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  format,
  parseISO,
  isToday as isTodayCheck,
  getHours,
  startOfDay, // Import startOfDay
  endOfDay, // Import endOfDay
} from "date-fns";
// TODO: Verify paths
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/lib/api/events";
import EventDetailDialog from "./event-detail-dialog";

interface DayViewProps {
  currentDate: Date; // The specific day to display
  onTimeSlotClick?: (date: Date) => void; // Callback for clicking an empty slot
  calendarIds: number[]; // Changed from projectIds
}

export default function DayView({
  currentDate,
  onTimeSlotClick,
  calendarIds, // Use calendarIds
}: DayViewProps) {
  // --- State ---
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // Use Event type
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // --- Calculate Time Range for the Day ---
  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);

  // --- Data Fetching ---
  // Fetch events for the current day using the updated hook
  const {
    data: events,
    isLoading,
    error,
  } = useEvents(calendarIds, dayStart, dayEnd);

  // --- Calendar Calculations ---
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

  // --- Filter events for the current day (already done by useEvents hook) ---
  // The useEvents hook now fetches only events for the specified day (dayStart to dayEnd)
  // We just need to sort them if needed (though API might already sort)
  const dayEvents = useMemo(() => {
    if (!events) return [];
    // Sort by start time just in case API doesn't guarantee order
    return [...events].sort((a, b) => {
      const timeA = a.start_time ? parseISO(a.start_time).getTime() : 0;
      const timeB = b.start_time ? parseISO(b.start_time).getTime() : 0;
      return timeA - timeB;
    });
  }, [events]);

  // --- Group events by START HOUR ---
  const eventsByHour = useMemo(() => {
    const grouped: Record<number, Event[]> = {}; // Use Event type
    dayEvents.forEach((event) => {
      // Use dayEvents
      if (event.start_time) {
        // Only group events with a start time
        try {
          const startHour = getHours(parseISO(event.start_time));
          if (!grouped[startHour]) {
            grouped[startHour] = [];
          }
          grouped[startHour].push(event); // Push event
          // Sorting is handled by dayEvents sort
        } catch (e) {
          console.error(
            "Error parsing event start_time for grouping:",
            event.start_time,
            e
          );
        }
      }
      // TODO: Handle all-day events if needed
    });
    return grouped;
  }, [dayEvents]); // Depend on dayEvents

  // --- Handlers ---
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  // --- Current Time Indicator Logic ---
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(
    null
  );
  const isCurrentDayDisplayed = isTodayCheck(currentDate);

  useEffect(() => {
    if (!isCurrentDayDisplayed) {
      setCurrentTimePosition(null);
      return;
    }
    const calculatePosition = () => {
      const now = new Date();
      const totalMinutesInDay = 24 * 60;
      const minutesPastMidnight = now.getHours() * 60 + now.getMinutes();
      const percentage = (minutesPastMidnight / totalMinutesInDay) * 100;
      setCurrentTimePosition(percentage);
    };
    calculatePosition();
    const intervalId = setInterval(calculatePosition, 60000);
    return () => clearInterval(intervalId);
  }, [currentDate, isCurrentDayDisplayed]);

  // --- Rendering ---
  // Update loading/error messages
  if (isLoading) {
    return <div className="p-4 text-center">Loading events...</div>;
  }
  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Error loading events: {error.message}
      </div>
    );
  }

  return (
    <>
      {" "}
      {/* Fragment needed for Dialog */}
      <div className="flex flex-col h-full">
        {/* Scrollable time grid area */}
        <div className="flex-1 overflow-auto p-4">
          <div className="relative grid grid-cols-[auto_1fr] gap-x-2">
            {/* Time column */}
            <div className="flex flex-col sticky top-0 bg-background z-10">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 text-right pr-2 text-xs text-muted-foreground border-b flex items-center justify-end"
                >
                  {format(new Date(0, 0, 0, hour), "ha")}
                </div>
              ))}
            </div>
            {/* Event area */}
            <div className="relative border-l">
              {/* Current Time Indicator Line */}
              {isCurrentDayDisplayed && currentTimePosition !== null && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                  style={{ top: `${currentTimePosition}%` }}
                >
                  <div className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-red-500"></div>
                </div>
              )}

              {/* Hour slots - Render events within each slot */}
              {hours.map((hour) => {
                const eventsInHour = eventsByHour[hour] || [];
                return (
                  <div
                    key={`cell-${hour}`}
                    className="h-12 border-b cursor-pointer hover:bg-accent/50 relative" // Add relative for potential absolute positioning of tasks *within* the slot if needed later
                    onClick={() => {
                      const clickedDateTime = new Date(currentDate);
                      clickedDateTime.setHours(hour, 0, 0, 0);
                      onTimeSlotClick?.(clickedDateTime);
                    }}
                  >
                    {/* Render events starting in this hour */}
                    <div className="p-1 space-y-0.5">
                      {" "}
                      {/* Container for events in this slot */}
                      {eventsInHour.map((event) => (
                        <div
                          key={event.id}
                          className="group relative flex items-center text-xs bg-primary/10 dark:bg-primary/30 text-primary-foreground rounded px-1 truncate cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/40"
                          title={event.title}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent slot click
                            handleEventClick(event); // Use handleEventClick
                          }}
                        >
                          {/* TODO: Add event-specific indicators if needed (e.g., color based on calendar) */}
                          {/* Time */}
                          <span className="mr-1 flex-shrink-0">
                            {event.start_time
                              ? format(parseISO(event.start_time), "HH:mm")
                              : ""}
                          </span>
                          {/* Title */}
                          <span className="flex-grow truncate">
                            {event.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Removed the separate absolute positioned task rendering div */}
            </div>
          </div>
        </div>
      </div>
      {/* Render the Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent} // Pass selectedEvent
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
}
