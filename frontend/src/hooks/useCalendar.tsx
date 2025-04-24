import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  Calendar,
  CreateCalendarPayload,
  UpdateCalendarPayload,
} from "@/lib/api/calendars"; // Adjusted import path
import { queryKeys } from "@/lib/queryKeys";

/**
 * Custom hook to fetch all calendars for the authenticated user.
 */
export const useCalendars = () => {
  return useQuery<Calendar[], Error>({
    queryKey: queryKeys.calendars,
    queryFn: () => getCalendars(), // Assumes client-side call relying on interceptor
    // Optional: Configure staleTime, cacheTime, etc.
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Custom hook to create a new calendar.
 */
export const useCreateCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation<Calendar, Error, CreateCalendarPayload>({
    mutationFn: createCalendar,
    onSuccess: (data) => {
      // Invalidate the calendars query cache to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.calendars });
      console.log("Calendar created successfully, cache invalidated.", data);
    },
    onError: (error) => {
      console.error("Error creating calendar:", error);
    },
  });
};

/**
 * Custom hook to update an existing calendar.
 */
export const useUpdateCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Calendar, // Return type on success
    Error, // Error type
    { calendarId: number; payload: UpdateCalendarPayload } // Input type for mutationFn
  >({
    mutationFn: ({ calendarId, payload }) =>
      updateCalendar(calendarId, payload),
    onSuccess: (data, variables) => {
      // Invalidate the calendars query cache
      queryClient.invalidateQueries({ queryKey: queryKeys.calendars });
      console.log(
        `Calendar ${variables.calendarId} updated successfully, cache invalidated.`,
        data
      );
    },
    onError: (error, variables) => {
      console.error(`Error updating calendar ${variables.calendarId}:`, error);
    },
  });
};

/**
 * Custom hook to delete a calendar.
 */
export const useDeleteCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void, // Return type on success (void for delete)
    Error, // Error type
    number // Input type for mutationFn (calendarId)
  >({
    mutationFn: deleteCalendar,
    onSuccess: (_, calendarId) => {
      // Invalidate the calendars query cache
      queryClient.invalidateQueries({ queryKey: queryKeys.calendars });

      // Optional: Consider if deleting a calendar should invalidate other related queries (e.g., events)
      // queryClient.invalidateQueries({ queryKey: queryKeys.events(calendarId) }); // Example

      console.log(
        `Calendar ${calendarId} deleted successfully, cache invalidated.`
      );
    },
    onError: (error, calendarId) => {
      console.error(`Error deleting calendar ${calendarId}:`, error);
    },
  });
};
