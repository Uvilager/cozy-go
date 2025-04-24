import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEventsByCalendar,
  createEvent,
  updateEvent,
  deleteEvent,
  Event,
  CreateEventPayload,
  UpdateEventPayload,
} from "@/lib/api/events"; // Adjusted import path
import { queryKeys } from "@/lib/queryKeys";

/**
 * Custom hook to fetch events for a specific calendar.
 * @param calendarId The ID of the calendar. Query is disabled if undefined.
 */
export const useEvents = (calendarId: number | undefined) => {
  return useQuery<Event[], Error>({
    // Use the dynamic query key function
    queryKey: queryKeys.events(calendarId),
    // Fetch only if calendarId is a positive number
    queryFn: () => {
      if (!calendarId) {
        // Should not happen if 'enabled' is set correctly, but good practice
        return Promise.resolve([]); // Return empty array or throw error
      }
      return getEventsByCalendar(calendarId);
    },
    // Disable the query if calendarId is not provided or invalid
    enabled: !!calendarId && calendarId > 0,
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
      // Invalidate the specific events query cache for the calendar the event belongs to
      queryClient.invalidateQueries({
        queryKey: queryKeys.events(data.calendar_id),
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
      // Invalidate the specific events query cache for the calendar the event belongs to
      queryClient.invalidateQueries({
        queryKey: queryKeys.events(data.calendar_id),
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
