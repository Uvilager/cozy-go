// This is now a Server Component by default
import React from "react";
import { cookies } from "next/headers";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import CalendarClientUI from "@/components/calendar/calendar-client-ui"; // Import the new client UI component
import { getProjects } from "@/lib/api"; // Example: Prefetch projects
import { queryKeys } from "@/lib/queryKeys";
import { startOfMonth } from "date-fns"; // For default date

// Make the component async to use await for prefetching
export default async function CalendarPage() {
//   {
//   searchParams, // Read search params for potential initial state
// }: {
//   searchParams?: { [key: string]: string | string[] | undefined };
// }
  const queryClient = new QueryClient();
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  // --- Optional Prefetching ---
  // Prefetch projects for the ProjectPicker in the Sidebar
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.projects,
      queryFn: () => getProjects(token), // Pass token if needed by API
    });
  } catch (error) {
    console.error("CalendarPage: Failed to prefetch projects:", error);
  }

  // --- Determine Initial State ---
  // You could potentially get initial date, view, or project from searchParams here
  // Example: const initialProjectIdParam = searchParams?.projectId as string | undefined;
  // const initialProjectId = initialProjectIdParam ? parseInt(initialProjectIdParam, 10) : undefined;
  // For now, we'll let the client component handle defaults
  const initialProjectId = undefined;
  const initialDate = startOfMonth(new Date()); // Default to current month start
  const initialView = "month"; // Default view

  return (
    // Pass the dehydrated state to the boundary
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* Render the Client Component, passing initial state values */}
      <CalendarClientUI
        initialDate={initialDate}
        initialView={initialView}
        initialProjectId={initialProjectId}
      />
    </HydrationBoundary>
  );
}
