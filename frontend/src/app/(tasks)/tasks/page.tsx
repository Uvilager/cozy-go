// No "use client" - this is now a Server Component
import React from "react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
// Task type might be needed if we handle data directly, but likely not with hooks/api layer
// import { Task } from "@/components/tasks/data/schema";
// import TaskTableClient from "@/components/tasks/task-table-client"; // Rendered by TasksView now
// import { ProjectPicker } from "@/components/projects/project-picker"; // Rendered by TasksView now
import TasksView from "@/components/tasks/tasks-view"; // Import the new client component wrapper
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
      {/* Render the TasksView client component, passing the initial ID */}
      <TasksView initialProjectId={projectIdToFetch} />
    </HydrationBoundary>
  );
}
