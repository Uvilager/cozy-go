"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCalendars } from "@/hooks/useCalendar"; // Corrected hook name: useCalendars
import { CalendarPicker } from "@/components/calendar/calendar-picker"; // Changed from ProjectPicker - Assuming this exists
import EventTableClient from "@/components/calendar/event-table-client"; // Changed from TaskTableClient - Assuming this exists

// Renamed interface and props
interface EventsViewProps {
  // Initial calendar ID derived from URL search param on the server
  initialCalendarId?: number | undefined;
}

// Renamed component and props
export default function EventsView({ initialCalendarId }: EventsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State to hold the currently selected calendar ID
  const [selectedCalendarId, setSelectedCalendarId] = useState<
    number | undefined
  >(initialCalendarId);

  // Fetch calendars
  const {
    data: calendars, // Changed from projects
    isLoading: isLoadingCalendars, // Changed from isLoadingProjects
    isError,
    error,
  } = useCalendars(); // Corrected hook name: useCalendars

  // Effect to handle default calendar selection and URL sync
  useEffect(() => {
    // Only run if calendars have loaded and no calendar is currently selected
    if (
      !isLoadingCalendars &&
      calendars &&
      calendars.length > 0 &&
      selectedCalendarId === undefined
    ) {
      console.log(
        "EventsView: No calendar selected, defaulting to first calendar." // Updated log message
      );
      const defaultCalendar = calendars[0]; // Changed from defaultProject
      setSelectedCalendarId(defaultCalendar.id); // Changed from setSelectedProjectId

      // Update URL with calendarId
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("calendarId", defaultCalendar.id.toString()); // Changed from projectId
      const search = current.toString();
      const query = search ? `?${search}` : "";
      // Use replace to avoid polluting browser history on initial default selection
      // Assuming the route remains /tasks for now, adjust if needed
      router.replace(`/tasks${query}`);
    }
    // If initialCalendarId was passed but isn't valid according to fetched calendars,
    // this logic will also select the first valid calendar.
  }, [calendars, isLoadingCalendars, selectedCalendarId, router, searchParams]); // Updated dependencies

  // Handler for when the calendar picker selection changes
  const handleCalendarChange = (calendarIdStr: string | undefined) => {
    // Renamed function and parameter
    const newCalendarId = calendarIdStr
      ? parseInt(calendarIdStr, 10)
      : undefined; // Changed variable name
    if (!isNaN(newCalendarId as number) || newCalendarId === undefined) {
      const validCalendarId = newCalendarId as number | undefined; // Changed variable name
      console.log("EventsView: Calendar changed to:", validCalendarId); // Updated log message
      setSelectedCalendarId(validCalendarId); // Changed state setter

      // Update URL with push to allow back navigation
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (validCalendarId !== undefined) {
        current.set("calendarId", validCalendarId.toString()); // Changed param name
      } else {
        current.delete("calendarId"); // Changed param name
      }
      const search = current.toString();
      const query = search ? `?${search}` : "";
      // Assuming the route remains /tasks for now
      router.push(`/tasks${query}`);
    } else {
      console.warn("Invalid calendar ID received from picker:", calendarIdStr); // Updated log message
    }
  };

  // --- Render Logic ---

  if (isError) {
    return (
      <div className="p-4 text-destructive">
        Error loading calendars: {error?.message} {/* Updated error message */}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-10 pb-16 md:block">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Events</h2>{" "}
          {/* Changed title */}
          <p className="text-muted-foreground">
            View and manage your calendar events. {/* Changed description */}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Render CalendarPicker */}
          {isLoadingCalendars ? ( // Changed loading state check
            <div className="text-sm text-muted-foreground">
              Loading calendars... {/* Updated loading text */}
            </div>
          ) : (
            <CalendarPicker // Changed component
              // Pass the string version of the selected ID back to picker
              currentCalendarId={selectedCalendarId?.toString()} // Changed prop name
              // Pass the handler that updates state and pushes router
              onCalendarChange={handleCalendarChange} // Changed prop name and handler
            />
          )}
          {/* TODO: Add Event Button - needs selectedCalendarId */}
          {/* <AddEventDialog calendarId={selectedCalendarId} /> */}
        </div>
      </div>

      {/* Event Table Section */}
      {selectedCalendarId !== undefined ? (
        <EventTableClient calendarId={selectedCalendarId} /> // Changed component and prop
      ) : (
        // Show message if still loading calendars or if no calendars exist/selected
        <div>
          {isLoadingCalendars // Changed loading state check
            ? "Loading calendars..." // Updated loading text
            : "Please select a calendar to view its events."}{" "}
          {/* Updated message */}
        </div>
      )}
    </div>
  );
}
