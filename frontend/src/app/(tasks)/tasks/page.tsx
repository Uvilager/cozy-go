// No "use client" - this is now a Server Component
import React from "react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
// Task type might be needed if we handle data directly, but likely not with hooks/api layer
// import { Task } from "@/components/tasks/data/schema";
import TaskTableClient from "@/components/tasks/task-table-client";
import { ProjectPicker } from "@/components/projects/project-picker";
// Import Project type along with API functions
import { getProjects, getTasksByProject } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys"; // Import query keys
import { cookies } from "next/headers"; // Import cookies function for Server Components

// Removed old fetch functions and Project interface (assuming it's defined/exported elsewhere if needed)
// API_URL is now handled within the axios instance/API layer

// Make the component async to use await for prefetching
// Accept searchParams prop for Server Components
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams; // Await the Promise to get the actual searchParams object
  const queryClient = new QueryClient();
  // Read the auth token from cookies on the server-side
  // Await cookies() and then get the value
  const cookieStore = await cookies(); // Await the cookies() function call
  const token = cookieStore.get("authToken")?.value;
  console.log(
    "TasksPage (Server): Read token from cookie - ",
    token ? "found" : "not found"
  );

  // Prefetch projects first, passing the token
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.projects,
      queryFn: () => getProjects(token), // Pass token here
    });
  } catch (error) {
    console.error("TasksPage: Failed to prefetch projects on server:", error);
    // Handle prefetch error if necessary (e.g., log)
  }

  // We no longer get projects data here on the server.
  // ProjectPicker client component will use the useProjects hook.

  // Determine the projectId to use based *only* on URL search params for server prefetch.
  // The client-side ProjectPicker will handle defaulting if the param is missing/invalid.
  const currentProjectIdParam = resolvedSearchParams.projectId as
    | string
    | undefined;
  let projectIdToFetch: number | undefined;

  // Try to parse the ID from the URL param. No fallback logic here on the server.
  if (currentProjectIdParam) {
    const parsedId = parseInt(currentProjectIdParam, 10);
    if (!isNaN(parsedId)) {
      projectIdToFetch = parsedId;
      // We don't validate against the actual project list here anymore,
      // as we don't have it readily available without getQueryData.
      // If the ID is invalid, the task prefetch might fail gracefully or fetch nothing.
    }
  }

  // Prefetch the task data only if a valid project ID is determined
  if (projectIdToFetch !== undefined) {
    try {
      await queryClient.prefetchQuery({
        // Use the centralized query key
        queryKey: queryKeys.tasks(projectIdToFetch),
        // Use the new API function, passing the token
        queryFn: () => getTasksByProject(projectIdToFetch, token), // Pass token here
      });
    } catch (error) {
      console.error(
        `TasksPage: Failed to prefetch tasks for project ${projectIdToFetch} on server:`,
        error
      );
      // Handle prefetch error if necessary (e.g., log, but maybe don't block rendering)
    }
  }

  // Dehydrate the query client's cache
  const dehydratedState = dehydrate(queryClient);

  return (
    // Pass the dehydrated state to the boundary
    <HydrationBoundary state={dehydratedState}>
      {/* Adjusted padding and removed container for full width header possibility */}
      <div className="space-y-6 p-10 pb-16 md:block">
        {/* Header Section with Flexbox */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          {/* Title and Subtitle */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
            <p className="text-muted-foreground">
              Manage your tasks and track your progress.
            </p>
          </div>
          {/* Project Picker on the right */}
          <div className="flex items-center space-x-2">
            <ProjectPicker currentProjectId={currentProjectIdParam} />
            {/* Add other actions here if needed, e.g., Add Task Button */}
          </div>
        </div>

        {/* Task Table Section */}
        {/* Render the Client Component, passing the projectId it should use */}
        {/* Conditionally render TaskTableClient */}
        {projectIdToFetch !== undefined ? (
          <TaskTableClient projectId={projectIdToFetch} />
        ) : (
          // Simplified fallback message as we don't have project count here
          <div>Please select a project to view its tasks.</div>
        )}
      </div>
      {/* Removed closing div for container as it's now handled by the outer div */}
    </HydrationBoundary>
  );
}
