import React from "react";
import { cookies } from "next/headers"; // Import cookies
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"; // Import hydration components
import { getMe, User } from "@/lib/api/auth"; // Combine User import
import { queryKeys } from "@/lib/queryKeys";
// Client-specific imports moved to HeaderContent component
// import { useUser } from "@/hooks/useAuth";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { ModeToggle } from "@/components/navbar/mode-toggle";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { HeaderContent } from "@/components/header/header-content";
import { DynamicBreadcrumbs } from "@/components/header/dynamic-breadcrumbs"; // Import DynamicBreadcrumbs
// Remove unused Breadcrumb imports from here if DynamicBreadcrumbs handles them all
// import {
//   Breadcrumb,
//   BreadcrumbList,
// } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

// This needs to be a client component to use the useUser hook in the header
// but we also need async for prefetching.
// We'll keep the prefetching logic here (server-side)
// and create a client component wrapper for the header content.

// HeaderContent component moved to its own file

// Main Layout remains async Server Component for prefetching
const Layout = async ({ children }: LayoutProps) => {
  const queryClient = new QueryClient();
  const cookieStore = await cookies(); // cookies() returns a Promise, need await
  const token = cookieStore.get("authToken")?.value; // Get token server-side

  // Prefetch user data only if token exists
  if (token) {
    console.log("Layout (Server): Auth token found, prefetching user...");
    try {
      // Prefetch using the query key and the API function
      // Pass the token explicitly if getMe requires it (assuming authAxiosInstance handles it for now)
      // We need to handle potential errors during prefetch gracefully
      await queryClient.prefetchQuery<User, Error, User, readonly string[]>({
        queryKey: queryKeys.user,
        queryFn: async () => {
          try {
            // Pass the token explicitly for server-side fetch
            const user = await getMe(token); // Pass token here
            return user;
          } catch (prefetchError) {
            // Log prefetch-specific error but throw it so prefetchQuery catches it
            console.error(
              "Layout (Server): getMe failed during prefetch:",
              prefetchError
            );
            throw prefetchError;
          }
        },
      });
      console.log("Layout (Server): User data prefetched successfully.");
    } catch (error) {
      // Log error but don't block rendering if prefetch fails
      console.error("Layout (Server): Failed to prefetch user data:", error);
      // Optionally clear the invalid cookie here if error indicates token expiry/invalidity
      // This might require more complex logic or a helper function
    }
  } else {
    console.log(
      "Layout (Server): No auth token found, skipping user prefetch."
    );
  }

  return (
    // Wrap children with HydrationBoundary
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-screen flex flex-col overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              {" "}
              {/* Added border */}
              {/* Left side: Trigger and Separator */}
              <div className="flex items-center">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mx-2 data-[orientation=vertical]:h-6" /* Adjusted spacing/height */
                />
                {/* Render the dynamic breadcrumbs component */}
                <DynamicBreadcrumbs />
              </div>
              {/* Right side: Auth buttons and ModeToggle */}
              <HeaderContent />
            </header>
            <main className="flex-grow overflow-auto p-4 md:p-6">
              {" "}
              {/* Adjusted padding */}
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </HydrationBoundary>
  );
};

export default Layout;
