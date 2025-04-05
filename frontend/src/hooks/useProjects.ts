import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/lib/api"; // Import from the barrel file
import { queryKeys } from "@/lib/queryKeys";

/**
 * Custom hook to fetch all projects.
 * Encapsulates the useQuery logic for fetching projects.
 */
export const useProjects = () => {
  return useQuery({
    queryKey: queryKeys.projects, // Use centralized query key
    queryFn: getProjects, // Use the API function
    // Optional: Configure staleTime, cacheTime, etc. here or in QueryClientProvider
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
