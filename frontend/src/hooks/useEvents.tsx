import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  // getEventsByCalendar, // Keep if needed elsewhere, remove if not
  getEventsByCalendarIDs, // Import the new function
  createEvent,
  updateEvent,
  deleteEvent,
  Event,
  CreateEventPayload,
  UpdateEventPayload,
} from "@/lib/api/events"; // Adjusted import path
import { queryKeys } from "@/lib/queryKeys";

/**
 * Custom hook to fetch events for one or more calendars within a specific time range.
 * @param calendarIds An array of calendar IDs. Query is disabled if undefined or empty.
 * @param startTime The start of the time range. Query is disabled if undefined.
 * @param endTime The end of the time range. Query is disabled if undefined.
 */
export const useEvents = (
  calendarIds: number[] | undefined,
  startTime: Date | undefined,
  endTime: Date | undefined
) => {
  // Sort IDs for a stable query key component
  const sortedIds = calendarIds ? [...calendarIds].sort((a, b) => a - b) : [];
  const queryKeyString = sortedIds.join(",");

  // Format dates for query key and API call (use ISO string for consistency)
  const startTimeString = startTime?.toISOString();
  const endTimeString = endTime?.toISOString();

  // Determine if the query should be enabled
  const enabled =
    !!calendarIds &&
    calendarIds.length > 0 &&
    !!startTimeString &&
    !!endTimeString;

  return useQuery<Event[], Error>({
    // Include calendar IDs and time range in the query key
    queryKey: ["events", queryKeyString, startTimeString, endTimeString],
    queryFn: () => {
      // queryFn is only called when enabled is true, so checks are slightly redundant but safe
      if (!enabled || !calendarIds || !startTimeString || !endTimeString) {
        console.warn(
          "useEvents: Query function called while disabled or with invalid params."
        );
        return Promise.resolve([]);
      }
      // Call the API function with the array of IDs and formatted time strings
      return getEventsByCalendarIDs(
        calendarIds,
        startTimeString,
        endTimeString
      );
    },
    // Disable the query if parameters are missing or invalid
    enabled: enabled,
    // Optional: Configure staleTime, cacheTime, etc.
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Custom hook to create a new event.
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<Event, Error, CreateEventPayload>({
    mutationFn: createEvent,
    onSuccess: (data) => {
      // Invalidate both query key patterns:
      // 1. The standard events query for this calendar
      queryClient.invalidateQueries({
        queryKey: queryKeys.events(data.calendar_id),
      });
      // 2. Any useEvents queries that might include this calendar
      queryClient.invalidateQueries({
        queryKey: ["events"],
      });
      console.log(
        `Event created successfully in calendar ${data.calendar_id}, cache invalidated.`,
        data
      );
    },
    onError: (error) => {
      console.error("Error creating event:", error);
    },
  });
};

/**
 * Custom hook to update an existing event.
 */
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Event, // Return type on success
    Error, // Error type
    { eventId: number; payload: UpdateEventPayload } // Input type for mutationFn
  >({
    mutationFn: ({ eventId, payload }) => updateEvent(eventId, payload),
    onSuccess: (data, variables) => {
      // Invalidate both query key patterns:
      // 1. The standard events query for this calendar
      queryClient.invalidateQueries({
        queryKey: queryKeys.events(data.calendar_id),
      });
      // 2. Any useEvents queries that might include this calendar
      queryClient.invalidateQueries({
        queryKey: ["events"],
      });
      console.log(
        `Event ${variables.eventId} in calendar ${data.calendar_id} updated successfully, cache invalidated.`,
        data
      );
    },
    onError: (error, variables) => {
      console.error(`Error updating event ${variables.eventId}:`, error);
    },
  });
};

/**
 * Custom hook to delete an event.
 * Requires both eventId and calendarId for cache invalidation.
 */
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void, // Return type on success (void for delete)
    Error, // Error type
    { eventId: number; calendarId: number } // Input type includes calendarId for invalidation
  >({
    // Destructure eventId for the API call
    mutationFn: ({ eventId }) => deleteEvent(eventId),
    // Use the passed calendarId for invalidation
    onSuccess: (_, { eventId, calendarId }) => {
      // Invalidate the specific events query cache
      queryClient.invalidateQueries({ queryKey: queryKeys.events(calendarId) });
      // 2. Any useEvents queries that might include this calendar
      queryClient.invalidateQueries({
        queryKey: ["events"],
      });
      console.log(
        `Event ${eventId} deleted successfully from calendar ${calendarId}, cache invalidated.`
      );
    },
    onError: (error, { eventId, calendarId }) => {
      console.error(
        `Error deleting event ${eventId} from calendar ${calendarId}:`,
        error
      );
    },
  });
};
