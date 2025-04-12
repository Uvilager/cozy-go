import React from "react";
import { cookies } from "next/headers"; // Import cookies
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"; // Import hydration components
import { Navbar } from "./navbar/navbar";
import { Footer } from "./footer/footer";
import { getMe } from "@/lib/api/auth"; // Import getMe API function
import { queryKeys } from "@/lib/queryKeys"; // Import queryKeys
import { User } from "@/lib/api/auth"; // Import User type

interface LayoutProps {
  children: React.ReactNode;
}

// Make Layout an async Server Component to allow data fetching
const Layout = async ({ children }: LayoutProps) => {
  const queryClient = new QueryClient();
  // Await cookies() as it returns a Promise
  const cookieStore = await cookies(); // No await needed here, cookies() is synchronous
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
      <div className="min-h-screen flex flex-col">
        {/* Navbar might need to be a client component if it uses useUser hook */}
        <Navbar />
        <main className="flex-grow container mx-auto p-4">{children}</main>
        <Footer />
      </div>
    </HydrationBoundary>
  );
};

export default Layout;
