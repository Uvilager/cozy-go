// // No "use client" - this is now a Server Component
// import React from "react";
// import {
//   HydrationBoundary,
//   QueryClient,
//   dehydrate,
// } from "@tanstack/react-query";
// // Task type might be needed if we handle data directly, but likely not with hooks/api layer
// // import { Task } from "@/components/tasks/data/schema";
// // Import the client component that will display calendars and events
// import EventsView from "@/components/calendar/events-view"; // Updated import to EventsView
// import { getCalendars, getEventsByCalendar } from "@/lib/api"; // Import calendar and event API functions
// import { queryKeys } from "@/lib/queryKeys"; // Import query keys
// import { cookies } from "next/headers"; // Import cookies function for Server Components

// // Removed old fetch functions and Project interface (assuming it's defined/exported elsewhere if needed)
// // API_URL is now handled within the axios instance/API layer

// // Make the component async to use await for prefetching
// // Accept searchParams prop for Server Components
// export default async function TasksPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
// }) {
//   const resolvedSearchParams = await searchParams; // Await the Promise to get the actual searchParams object
//   const queryClient = new QueryClient();
//   // Read the auth token from cookies on the server-side
//   // Await cookies() and then get the value
//   const cookieStore = await cookies(); // Await the cookies() function call
//   const token = cookieStore.get("authToken")?.value;
//   console.log(
//     "TasksPage (Server): Read token from cookie - ",
//     token ? "found" : "not found"
//   );

//   // Prefetch calendars first, passing the token
//   try {
//     await queryClient.prefetchQuery({
//       queryKey: queryKeys.calendars, // Use calendar query key
//       queryFn: () => getCalendars(token), // Use getCalendars API function
//     });
//   } catch (error) {
//     console.error("TasksPage: Failed to prefetch calendars on server:", error);
//     // Handle prefetch error if necessary (e.g., log)
//   }

//   // We no longer get calendar data here on the server.
//   // The client component (e.g., CalendarPicker) will use the useCalendar hook.

//   // Determine the calendarId to use based *only* on URL search params for server prefetch.
//   // The client-side component will handle defaulting if the param is missing/invalid.
//   const currentCalendarIdParam = resolvedSearchParams.calendarId as  // Changed from projectId
//     | string
//     | undefined;
//   let calendarIdToFetch: number | undefined;

//   // Try to parse the ID from the URL param. No fallback logic here on the server.
//   if (currentCalendarIdParam) {
//     const parsedId = parseInt(currentCalendarIdParam, 10);
//     if (!isNaN(parsedId)) {
//       calendarIdToFetch = parsedId;
//       // We don't validate against the actual calendar list here.
//       // If the ID is invalid, the event prefetch might fail gracefully or fetch nothing.
//     }
//   }

//   // Prefetch the event data only if a valid calendar ID is determined
//   if (calendarIdToFetch !== undefined) {
//     try {
//       // Prefetch using the new function and event query key structure
//       await queryClient.prefetchQuery({
//         // Use the centralized event query key, passing the ID
//         queryKey: queryKeys.events(calendarIdToFetch),
//         // Use the new API function, passing the ID and the token
//         queryFn: () => getEventsByCalendar(calendarIdToFetch, token),
//       });
//     } catch (error) {
//       console.error(
//         `TasksPage: Failed to prefetch events for calendar ${calendarIdToFetch} on server:`,
//         error
//       );
//       // Handle prefetch error if necessary (e.g., log, but maybe don't block rendering)
//     }
//   }

//   // Dehydrate the query client's cache
//   const dehydratedState = dehydrate(queryClient);

//   return (
//     // Pass the dehydrated state to the boundary
//     <HydrationBoundary state={dehydratedState}>
//       {/* Render the client component, passing the initial calendar ID */}
//       <EventsView initialCalendarId={calendarIdToFetch} />
//     </HydrationBoundary>
//   );
// }
