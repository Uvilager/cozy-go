/**
 * Centralized query keys for React Query.
 * Helps maintain consistency and avoid typos.
 */
export const queryKeys = {
  // Key for fetching all projects
  projects: ["projects"] as const,

  // Key for fetching tasks related to a specific project
  // Uses a function to ensure the project ID is included dynamically
  tasks: (projectId: number | undefined) => ["tasks", projectId] as const,

  // Example for fetching a single task (add if needed later)
  // task: (taskId: number) => ["task", taskId] as const,

  // Add other query keys as the application grows
};

// Explanation:
// - Using `as const` provides better type safety and autocompletion.
// - Functions for keys with dynamic parts (like projectId) ensure consistency.
