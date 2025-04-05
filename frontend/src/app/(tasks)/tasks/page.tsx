// No "use client" - this is now a Server Component
import React from "react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { Task } from "@/components/tasks/data/schema"; // Import the Task type
import TaskTableClient from "@/components/tasks/task-table-client"; // Import the new client component
import { ProjectPicker } from "@/components/tasks/project-picker"; // Import the ProjectPicker

// Define the API endpoint URL (adjust if your backend runs elsewhere)
// Assuming task-service is running and accessible via localhost:8081
const API_URL =
  process.env.NEXT_PUBLIC_TASK_SERVICE_URL || "http://localhost:8081";

// Define a simple type for Project (adjust if needed based on your API)
interface Project {
  id: number;
  name: string;
}

// Function to fetch all projects
async function fetchProjects(): Promise<Project[]> {
  console.log(`SERVER: Fetching projects from ${API_URL}...`);
  const response = await fetch(`${API_URL}/projects`, { cache: "no-store" });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("SERVER Fetch projects error:", response.status, errorText);
    throw new Error(
      `Failed to fetch projects: ${response.statusText} - ${errorText}`
    );
  }
  const data = await response.json();
  console.log("SERVER: Projects fetched successfully:", data);
  return Array.isArray(data) ? data : [];
}

// Function to fetch tasks for a specific project
// TODO: Make projectId dynamic if needed
const projectId = 1; // This will be replaced soon
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
// Accept searchParams prop for Server Components
export default async function TasksPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const queryClient = new QueryClient();

  // Fetch projects first
  const projects = await fetchProjects();

  // Determine the projectId to use
  // Get from URL search params, default to the first project if available, or handle no projects case
  const currentProjectIdParam = searchParams?.projectId as string | undefined;
  let projectIdToFetch: number | undefined;

  if (
    currentProjectIdParam &&
    projects.some((p) => p.id.toString() === currentProjectIdParam)
  ) {
    projectIdToFetch = parseInt(currentProjectIdParam, 10);
  } else if (projects.length > 0) {
    projectIdToFetch = projects[0].id; // Default to the first project
  }

  // Prefetch the task data only if a valid project ID is determined
  if (projectIdToFetch !== undefined) {
    await queryClient.prefetchQuery({
      // This queryKey MUST match the one used in TaskTableClient
      queryKey: ["tasks", projectIdToFetch], // Use the dynamic project ID
      queryFn: () => fetchTasks(projectIdToFetch), // Use the dynamic project ID
    });
  }

  // Dehydrate the query client's cache
  const dehydratedState = dehydrate(queryClient);

  return (
    // Pass the dehydrated state to the boundary
    <HydrationBoundary state={dehydratedState}>
      <div className="container mx-auto py-10">
        {/* Render the Project Picker */}
        <ProjectPicker
          projects={projects}
          currentProjectId={currentProjectIdParam}
        />
        <h1 className="text-3xl font-bold mb-6">Task Management</h1>
        {/* Render the Client Component, passing the projectId it should use */}
        {/* Conditionally render TaskTableClient only if a project is selected */}
        {projectIdToFetch !== undefined ? (
          <TaskTableClient projectId={projectIdToFetch} />
        ) : (
          <div>Please select a project to view tasks.</div> // Or some other placeholder
        )}
      </div>
    </HydrationBoundary>
  );
}
