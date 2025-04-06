import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  createProject,
  CreateProjectPayload,
  Project,
} from "@/lib/api"; // Import creation function and types
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

/**
 * Custom hook to create a new project.
 * Encapsulates the useMutation logic for creating a project.
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, CreateProjectPayload>({
    mutationFn: createProject, // The API function to call
    onSuccess: (data) => {
      // When the mutation is successful, invalidate the projects query cache
      // This will trigger a refetch of the projects list, including the new one.
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });

      // Optional: You could also manually update the cache here for a faster UI update
      // queryClient.setQueryData(queryKeys.projects, (oldData: Project[] | undefined) => {
      //   return oldData ? [...oldData, data] : [data];
      // });

      console.log("Project created successfully, cache invalidated.", data);
    },
    onError: (error) => {
      // Handle or log the error. UI feedback (e.g., toast) is often done in the component.
      console.error("Error creating project:", error);
    },
  });
};
