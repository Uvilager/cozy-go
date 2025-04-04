// No "use client" - this is now a Server Component
import React from "react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { Task } from "@/components/tasks/data/schema"; // Import the Task type
import TaskTableClient from "@/components/tasks/task-table-client"; // Import the new client component

// Define the API endpoint URL (adjust if your backend runs elsewhere)
// Assuming task-service is running and accessible via localhost:8081
const API_URL =
  process.env.NEXT_PUBLIC_TASK_SERVICE_URL || "http://localhost:8081";

// Function to fetch tasks for a specific project
// TODO: Make projectId dynamic if needed
const projectId = 1;
async function fetchTasks(projectId: number): Promise<Task[]> {
  // Fetching on the server - can use direct fetch
  console.log(
    `SERVER: Fetching tasks for project ${projectId} from ${API_URL}...`
  );
  const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
    cache: "no-store", // Ensure fresh data is fetched on each request for server components
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("SERVER Fetch error:", response.status, errorText);
    // Decide how to handle server-side fetch errors - maybe throw to trigger error boundary?
    throw new Error(
      `Failed to fetch tasks: ${response.statusText} - ${errorText}`
    );
  }
  const data = await response.json();
  console.log("SERVER: Tasks fetched successfully:", data);
  return Array.isArray(data) ? data : [];
}

// Make the component async to use await for prefetching
// Renamed component to reflect its new location/purpose
export default async function TasksPage() {
  const queryClient = new QueryClient();

  // Prefetch the data on the server
  await queryClient.prefetchQuery({
    // This queryKey MUST match the one used in TaskTableClient
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId),
  });

  // Dehydrate the query client's cache
  const dehydratedState = dehydrate(queryClient);

  return (
    // Pass the dehydrated state to the boundary
    <HydrationBoundary state={dehydratedState}>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Task Management</h1>
        {/* Render the Client Component that uses useQuery */}
        <TaskTableClient />
      </div>
    </HydrationBoundary>
  );
}
