"use client"; // Mark this as a Client Component

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Optional: If you want React Query DevTools
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Create a client
// It's often recommended to create the client outside the component
// to prevent it from being recreated on every render, especially in StrictMode.
// However, for simplicity here, we create it inside, but ensure it's stable.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if using
    // React 18 streaming server-side rendering features.
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // NOTE: Avoid useState when initializing the query client if you are using
  // Suspense boundaries with concurrent rendering features.
  const queryClient = getQueryClient();

  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Optional: React Query DevTools */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
