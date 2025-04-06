import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  createProject,
  updateProject, // Import update function
  deleteProject, // Import delete function
  CreateProjectPayload,
  UpdateProjectPayload, // Import update payload type
  Project,
} from "@/lib/api";
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

/**
 * Custom hook to update an existing project.
 * Encapsulates the useMutation logic for updating a project.
 */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Project, // Return type on success
    Error, // Error type
    { projectId: number; payload: UpdateProjectPayload } // Input type for mutationFn
  >({
    // The mutation function needs to accept an object with projectId and payload
    mutationFn: ({ projectId, payload }) => updateProject(projectId, payload),
    onSuccess: (data, variables) => {
      // Invalidate the general projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });

      // Optional: Directly update the cache for this specific project if needed elsewhere
      // queryClient.setQueryData(queryKeys.project(variables.projectId), data);

      console.log(
        `Project ${variables.projectId} updated successfully, cache invalidated.`,
        data
      );
    },
    onError: (error, variables) => {
      console.error(`Error updating project ${variables.projectId}:`, error);
    },
  });
};

/**
 * Custom hook to delete a project.
 * Encapsulates the useMutation logic for deleting a project.
 */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void, // Return type on success (usually void for delete)
    Error, // Error type
    number // Input type for mutationFn (projectId)
  >({
    mutationFn: deleteProject, // The API function to call
    onSuccess: (_, projectId) => {
      // When the mutation is successful, invalidate the projects query cache
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });

      // IMPORTANT: Also invalidate tasks associated with this project
      // This assumes you have a query key structure like queryKeys.tasks(projectId)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });

      // Optional: Remove the project from the cache immediately for faster UI update
      // queryClient.setQueryData(queryKeys.projects, (oldData: Project[] | undefined) => {
      //   return oldData ? oldData.filter(p => p.id !== projectId) : [];
      // });

      console.log(
        `Project ${projectId} deleted successfully, projects and tasks cache invalidated.`
      );
    },
    onError: (error, projectId) => {
      console.error(`Error deleting project ${projectId}:`, error);
    },
  });
};
