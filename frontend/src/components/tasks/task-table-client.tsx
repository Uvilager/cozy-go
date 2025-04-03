"use client"; // This component uses hooks

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { columns } from "@/components/tasks/columns";
import { DataTable } from "@/components/tasks/data-table";
import { Task } from "@/components/tasks/data/schema";

// Re-define or import fetchTasks and API_URL if not accessible globally
// (For simplicity, duplicating fetchTasks here, consider moving to a shared api lib)
const API_URL =
  process.env.NEXT_PUBLIC_TASK_SERVICE_URL || "http://localhost:8081";
const projectId = 1; // TODO: Make dynamic if needed

async function fetchTasks(projectId: number): Promise<Task[]> {
  console.log(`Fetching tasks for project ${projectId} from ${API_URL}...`); // Add log
  const response = await fetch(`${API_URL}/projects/${projectId}/tasks`);
  if (!response.ok) {
    const errorText = await response.text(); // Get more error details
    console.error("Fetch error:", response.status, errorText); // Log error details
    throw new Error(
      `Failed to fetch tasks: ${response.statusText} - ${errorText}`
    );
  }
  const data = await response.json();
  console.log("Tasks fetched successfully:", data); // Log success
  return Array.isArray(data) ? data : [];
}

export default function TaskTableClient() {
  const {
    data: tasksData,
    isLoading, // Still useful for background loading indicators
    isError,
    error,
  } = useQuery<Task[], Error>({
    // This queryKey MUST match the one used for prefetching on the server
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId),
    // staleTime is inherited from QueryClientProvider defaults,
    // or can be set here specifically.
  });

  // Although data is prefetched, isLoading might be true briefly initially
  // or during background refetches. You might want a subtle loading indicator.
  // For initial load, hydration handles the "no loading state" experience.

  // Handle error state (e.g., if refetch fails)
  if (isError && !tasksData) {
    // Only show full error if there's no data at all
    return (
      <div className="text-red-600">
        Error fetching tasks: {error?.message || "Unknown error"}
      </div>
    );
  }

  // Data is either hydrated from the server or fetched client-side.
  // Provide a default empty array if tasksData is undefined initially.
  const data = tasksData ?? [];

  // Optional: Show subtle loading state for background refetches
  // if (isLoading && tasksData) { ... show subtle indicator ... }

  return <DataTable columns={columns} data={data} />;
}
