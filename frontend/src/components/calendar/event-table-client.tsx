"use client"; // This component uses hooks

import React from "react";
import { columns } from "@/components/calendar/table/columns"; // Adjusted path for event columns
import { DataTable } from "@/components/calendar/table/data-table"; // Adjusted path for event data table
import { useEvents } from "@/hooks/useEvents"; // Import the events hook

// Define props interface
interface EventTableClientProps {
  calendarId: number | undefined; // Use calendarId
  // TODO: Potentially add startTime/endTime props later for custom ranges
}

export default function EventTableClient({
  calendarId,
}: EventTableClientProps) {
  // Define default time range (e.g., current month)
  const now = new Date();
  const startTime = new Date(now.getFullYear(), now.getMonth(), 1);
  const endTime = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Day 0 of next month = last day of current month

  // Prepare calendarIds array
  const calendarIdsArray = calendarId !== undefined ? [calendarId] : undefined;

  // Use the custom hook to fetch events with the time range
  const {
    data: eventsData,
    isLoading, // Use loading state from the hook
    isError, // Use error state from the hook
    error, // Use error object from the hook
  } = useEvents(calendarIdsArray, startTime, endTime); // Pass array and time range

  // Handle loading state
  if (isLoading && !eventsData) {
    return <div>Loading events...</div>;
  }

  // Handle error state
  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <div className="text-red-600">Error fetching events: {errorMessage}</div>
    );
  }

  // Data is either hydrated from the server or fetched successfully client-side.
  const data = eventsData ?? [];

  // Render the DataTable with the fetched or hydrated data, passing calendarId
  return <DataTable columns={columns} data={data} calendarId={calendarId} />;
}
