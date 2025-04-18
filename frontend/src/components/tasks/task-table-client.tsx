"use client"; // This component uses hooks

import React from "react";
// Removed useQuery import as it's now in the hook
import { columns } from "@/components/tasks/table/columns"; // Adjusted path based on file structure
import { DataTable } from "@/components/tasks/table/data-table"; // Adjusted path based on file structure
import { useTasks } from "@/hooks/useTasks"; // Import the updated hook

// Removed duplicated fetchTasks and API_URL

// Define props interface
interface TaskTableClientProps {
  projectId: number | undefined; // Allow undefined projectId
}

export default function TaskTableClient({ projectId }: TaskTableClientProps) {
  // Use the custom hook to fetch tasks
  const {
    data: tasksData,
    isLoading, // Use loading state from the hook
    isError, // Use error state from the hook
    error, // Use error object from the hook
  } = useTasks(projectId !== undefined ? [projectId] : undefined); // Pass projectId as an array if defined

  // Handle loading state (initial load is handled by hydration, but this catches refetches)
  if (isLoading && !tasksData) {
    // Show a loading indicator only if there's no data yet (initial load/hydration failed?)
    return <div>Loading tasks...</div>;
  }

  // Handle error state
  if (isError) {
    // Display error message. Check if error is an AxiosError for more details.
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <div className="text-red-600">Error fetching tasks: {errorMessage}</div>
    );
  }

  // Data is either hydrated from the server or fetched successfully client-side.
  // Default to empty array if data is still undefined (shouldn't happen if not loading/erroring)
  const data = tasksData ?? [];

  // Optional: Show subtle loading state for background refetches even if data exists
  // if (isLoading) { ... show subtle indicator on top of the table ... }

  // Render the DataTable with the fetched or hydrated data, passing projectId
  return <DataTable columns={columns} data={data} projectId={projectId} />;
}
