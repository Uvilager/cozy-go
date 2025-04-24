import { calendarAxiosInstance } from "../axios"; // Import the specific instance

// Define Calendar type based on Go model
export interface Calendar {
  id: number;
  user_id: number; // Note: user_id is present in the Go model
  name: string;
  description?: string; // Optional based on omitempty
  color?: string; // Optional hex code, e.g., "#FFFFFF"
  created_at: string; // Assuming time.Time serializes to string (e.g., ISO 8601)
  updated_at: string;
}

// Define the type for the data needed to create a calendar
export interface CreateCalendarPayload {
  name: string;
  description?: string; // Optional
  color?: string; // Optional, e.g., "#RRGGBB"
}

// Define the type for the data needed to update a calendar
export type UpdateCalendarPayload = Partial<CreateCalendarPayload>;

/**
 * Fetches all calendars for the authenticated user from the API.
 * @param token Optional auth token for server-side requests.
 * @returns A promise that resolves to an array of calendars.
 */
export const getCalendars = async (token?: string): Promise<Calendar[]> => {
  try {
    console.log("API: Fetching calendars...");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log(
        "getCalendars: Using provided token for server-side request."
      );
    } // Client-side calls rely on the interceptor

    // Use calendarAxiosInstance
    const response = await calendarAxiosInstance.get<Calendar[]>("/calendars", {
      headers,
    });

    if (response.status !== 200) {
      console.warn(
        `API: Unexpected status code ${response.status} fetching calendars.`
      );
      return [];
    }

    console.log("API: Calendars fetched successfully:", response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("API Error fetching calendars:", error);
    throw error;
  }
};

/**
 * Creates a new calendar.
 * @param calendarData The data for the new calendar.
 * @param token Optional auth token.
 * @returns A promise that resolves to the newly created calendar.
 */
export const createCalendar = async (
  calendarData: CreateCalendarPayload,
  token?: string
): Promise<Calendar> => {
  try {
    console.log("API: Creating calendar...", calendarData);
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // Ensure optional fields are not sent if empty/undefined, matching backend omitempty
    const payload = { ...calendarData };
    if (payload.description === "" || payload.description === undefined) {
      delete payload.description;
    }
    if (payload.color === "" || payload.color === undefined) {
      delete payload.color;
    }

    // Use calendarAxiosInstance
    const response = await calendarAxiosInstance.post<Calendar>(
      "/calendars",
      payload,
      { headers }
    );

    if (response.status !== 201) {
      // Expect 201 Created
      console.warn(
        `API: Unexpected status code ${response.status} creating calendar. Expected 201.`
      );
      throw new Error(
        `Failed to create calendar: Status ${
          response.status
        }, Data: ${JSON.stringify(response.data)}`
      );
    }

    console.log("API: Calendar created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Error creating calendar:", error);
    throw error;
  }
};

/**
 * Updates an existing calendar.
 * @param calendarId The ID of the calendar to update.
 * @param calendarData The data to update the calendar with.
 * @param token Optional auth token.
 * @returns A promise that resolves to the updated calendar.
 */
export const updateCalendar = async (
  calendarId: number,
  calendarData: UpdateCalendarPayload,
  token?: string
): Promise<Calendar> => {
  if (!calendarId) {
    throw new Error("Calendar ID is required to update a calendar.");
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(`API: Updating calendar ${calendarId}...`, calendarData);
    // Ensure optional fields are not sent if empty/undefined
    const payload = { ...calendarData };
    if (payload.description === "" || payload.description === undefined) {
      delete payload.description;
    }
    if (payload.color === "" || payload.color === undefined) {
      delete payload.color;
    }

    // Use calendarAxiosInstance
    const response = await calendarAxiosInstance.put<Calendar>(
      `/calendars/${calendarId}`,
      payload,
      { headers }
    );

    if (response.status !== 200) {
      // Expect 200 OK
      console.warn(
        `API: Unexpected status code ${response.status} updating calendar ${calendarId}. Expected 200.`
      );
      throw new Error(
        `Failed to update calendar: Status ${
          response.status
        }, Data: ${JSON.stringify(response.data)}`
      );
    }

    console.log(
      `API: Calendar ${calendarId} updated successfully:`,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(`API Error updating calendar ${calendarId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific calendar.
 * @param calendarId The ID of the calendar to delete.
 * @param token Optional auth token.
 * @returns A promise that resolves when the calendar is deleted.
 */
export const deleteCalendar = async (
  calendarId: number,
  token?: string
): Promise<void> => {
  if (!calendarId) {
    throw new Error("Calendar ID is required to delete a calendar.");
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(`API: Deleting calendar ${calendarId}...`);
    // Use calendarAxiosInstance
    const response = await calendarAxiosInstance.delete(
      `/calendars/${calendarId}`,
      { headers }
    );

    // Expect 200 OK or 204 No Content
    if (response.status !== 200 && response.status !== 204) {
      console.error(
        `API: Unexpected status code ${response.status} deleting calendar ${calendarId}. Expected 200 or 204.`
      );
      throw new Error(
        `Failed to delete calendar ${calendarId}: Status ${response.status}`
      );
    }

    console.log(
      `API: Calendar ${calendarId} deleted successfully. Status: ${response.status}`
    );
  } catch (error) {
    console.error(`API Error deleting calendar ${calendarId}:`, error);
    throw error;
  }
};
