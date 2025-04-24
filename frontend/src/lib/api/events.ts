import { eventAxiosInstance } from "../axios"; // Import the specific instance

// Define Event type based on Go model
export interface Event {
  id: number;
  calendar_id: number;
  user_id: number;
  title: string;
  description?: string;
  start_time: string; // ISO 8601 string format expected from Go time.Time
  end_time: string; // ISO 8601 string format expected from Go time.Time
  location?: string;
  color?: string; // Optional hex code
  created_at: string;
  updated_at: string;
}

// Define the type for the data needed to create an event
// Note: calendar_id will likely be part of the URL or context, not payload
// user_id is set by the backend based on the auth token
export interface CreateEventPayload {
  calendar_id: number; // Include calendar_id as it's needed for creation logic/association
  title: string;
  description?: string;
  start_time: string; // Use string for ISO 8601 format
  end_time: string; // Use string for ISO 8601 format
  location?: string;
  color?: string;
}

// Define the type for the data needed to update an event
// Exclude calendar_id and user_id as they typically aren't updatable
export type UpdateEventPayload = Partial<
  Omit<CreateEventPayload, "calendar_id">
>;

/**
 * Fetches all events for a specific calendar from the API.
 * @param calendarId The ID of the calendar whose events are to be fetched.
 * @param token Optional auth token for server-side requests.
 * @returns A promise that resolves to an array of events.
 */
export const getEventsByCalendar = async (
  calendarId: number,
  token?: string
): Promise<Event[]> => {
  if (!calendarId) {
    console.warn("API: Calendar ID is required to fetch events.");
    return []; // Or throw an error
  }
  try {
    console.log(`API: Fetching events for calendar ${calendarId}...`);
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Use eventAxiosInstance
    const response = await eventAxiosInstance.get<Event[]>(
      `/calendars/${calendarId}/events`, // Correct endpoint
      { headers }
    );

    if (response.status !== 200) {
      console.warn(
        `API: Unexpected status code ${response.status} fetching events for calendar ${calendarId}.`
      );
      return [];
    }

    console.log(
      `API: Events for calendar ${calendarId} fetched successfully:`,
      response.data
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(
      `API Error fetching events for calendar ${calendarId}:`,
      error
    );
    throw error;
  }
};

/**
 * Creates a new event.
 * Note: The backend handler likely extracts calendar_id from the payload or context.
 * @param eventData The data for the new event.
 * @param token Optional auth token.
 * @returns A promise that resolves to the newly created event.
 */
export const createEvent = async (
  eventData: CreateEventPayload,
  token?: string
): Promise<Event> => {
  try {
    console.log("API: Creating event...", eventData);
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // Clean payload: remove empty optional fields
    const payload = { ...eventData };
    if (payload.description === "" || payload.description === undefined) {
      delete payload.description;
    }
    if (payload.location === "" || payload.location === undefined) {
      delete payload.location;
    }
    if (payload.color === "" || payload.color === undefined) {
      delete payload.color;
    }

    // Use eventAxiosInstance
    const response = await eventAxiosInstance.post<Event>("/events", payload, {
      headers,
    });

    if (response.status !== 201) {
      // Expect 201 Created
      console.warn(
        `API: Unexpected status code ${response.status} creating event. Expected 201.`
      );
      throw new Error(
        `Failed to create event: Status ${
          response.status
        }, Data: ${JSON.stringify(response.data)}`
      );
    }

    console.log("API: Event created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Error creating event:", error);
    throw error;
  }
};

/**
 * Updates an existing event.
 * @param eventId The ID of the event to update.
 * @param eventData The data to update the event with.
 * @param token Optional auth token.
 * @returns A promise that resolves to the updated event.
 */
export const updateEvent = async (
  eventId: number,
  eventData: UpdateEventPayload,
  token?: string
): Promise<Event> => {
  if (!eventId) {
    throw new Error("Event ID is required to update an event.");
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(`API: Updating event ${eventId}...`, eventData);
    // Clean payload
    const payload = { ...eventData };
    if (payload.description === "" || payload.description === undefined) {
      delete payload.description;
    }
    if (payload.location === "" || payload.location === undefined) {
      delete payload.location;
    }
    if (payload.color === "" || payload.color === undefined) {
      delete payload.color;
    }

    // Use eventAxiosInstance
    const response = await eventAxiosInstance.put<Event>(
      `/events/${eventId}`,
      payload,
      { headers }
    );

    if (response.status !== 200) {
      // Expect 200 OK
      console.warn(
        `API: Unexpected status code ${response.status} updating event ${eventId}. Expected 200.`
      );
      throw new Error(
        `Failed to update event: Status ${
          response.status
        }, Data: ${JSON.stringify(response.data)}`
      );
    }

    console.log(`API: Event ${eventId} updated successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`API Error updating event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific event.
 * @param eventId The ID of the event to delete.
 * @param token Optional auth token.
 * @returns A promise that resolves when the event is deleted.
 */
export const deleteEvent = async (
  eventId: number,
  token?: string
): Promise<void> => {
  if (!eventId) {
    throw new Error("Event ID is required to delete an event.");
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(`API: Deleting event ${eventId}...`);
    // Use eventAxiosInstance
    const response = await eventAxiosInstance.delete(`/events/${eventId}`, {
      headers,
    });

    // Expect 200 OK or 204 No Content
    if (response.status !== 200 && response.status !== 204) {
      console.error(
        `API: Unexpected status code ${response.status} deleting event ${eventId}. Expected 200 or 204.`
      );
      throw new Error(
        `Failed to delete event ${eventId}: Status ${response.status}`
      );
    }

    console.log(
      `API: Event ${eventId} deleted successfully. Status: ${response.status}`
    );
  } catch (error) {
    console.error(`API Error deleting event ${eventId}:`, error);
    throw error;
  }
};
