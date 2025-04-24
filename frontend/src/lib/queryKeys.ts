/**
 * Centralized query keys for React Query.
 * Helps maintain consistency and avoid typos.
 */
export const queryKeys = {
  // Key for fetching all projects
  projects: ["projects"] as const,

  // Key for fetching tasks, potentially filtered by project IDs.
  // Handles undefined (all tasks for user?), single ID, or array of IDs.
  // Sorting the array ensures key consistency regardless of ID order.
  tasks: (projectIds: number | number[] | undefined) => {
    if (Array.isArray(projectIds)) {
      // If it's an array, sort it and spread into the key
      return ["tasks", ...projectIds.sort()] as const;
    }
    // If it's a single number or undefined, use it directly
    return ["tasks", projectIds] as const;
  },

  // Example for fetching a single task (add if needed later)
  // task: (taskId: number) => ["task", taskId] as const,

  // Key for fetching the current authenticated user
  user: ["user"] as const,

  // Key for fetching all calendars
  calendars: ["calendars"] as const,

  // Key for fetching events for a specific calendar.
  // Handles undefined calendarId (maybe fetch all user events in future?)
  events: (calendarId: number | undefined) =>
    ["events", { calendarId }] as const,

  // Add other query keys as the application grows
};

// Explanation:
// - Using `as const` provides better type safety and autocompletion.
// - Functions for keys with dynamic parts (like projectId) ensure consistency.
