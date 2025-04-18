import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Consolidate imports
import {
  // getTasksByProject, // Keep if needed elsewhere, otherwise remove
  getTasksByProjectIds, // Import the new function
  createTask,
  CreateTaskPayload,
  deleteTask,
  updateTask,
  UpdateTaskPayload,
} from "@/lib/api"; // Import API functions
import { queryKeys } from "@/lib/queryKeys"; // Import query keys
import { Task } from "@/components/tasks/data/schema"; // Import Task type (moved to top)
import { toast } from "sonner"; // Import toast

// useProjects hook moved to useProjects.ts

/**
 * Custom hook to fetch tasks, optionally filtered by one or more project IDs.
 * Encapsulates the useQuery logic for fetching tasks.
 * @param projectIds An array of project IDs to filter by, or undefined/empty to fetch none (or all, depending on API).
 */
export const useTasks = (projectIds: number[] | undefined) => {
  // Ensure projectIds is always an array for the query key, even if empty
  const queryKeyProjectIds = Array.isArray(projectIds) ? projectIds : [];

  return useQuery({
    // Assuming queryKeys.tasks can handle an array. We might need to adjust queryKeys.ts later.
    // Sorting ensures the key is consistent regardless of ID order.
    queryKey: queryKeys.tasks(queryKeyProjectIds.sort()),
    queryFn: () => {
      // Only fetch if projectIds is a non-empty array
      if (!Array.isArray(projectIds) || projectIds.length === 0) {
        // Return empty array if no projects are selected
        return Promise.resolve([]);
      }
      // Call the new API function
      return getTasksByProjectIds(projectIds);
    },
    // The query will only run if projectIds is an array with at least one element.
    enabled: Array.isArray(projectIds) && projectIds.length > 0,
    // Optional: Configure staleTime, cacheTime, etc.
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Removed duplicate imports below

/**
 * Custom hook for creating a new task.
 * Encapsulates the useMutation logic for task creation.
 * @param options Optional callbacks like onSuccess, onError to be executed *after* the hook's internal handlers.
 */
export const useCreateTask = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn now expects an object with payload and projectId
    mutationFn: (variables: {
      payload: CreateTaskPayload;
      projectId: number;
    }) => {
      const { payload, projectId } = variables;
      // Basic check, though form validation should handle this
      if (typeof projectId !== "number" || projectId <= 0) {
        return Promise.reject(new Error("Valid Project ID is required."));
      }
      // Call API with projectId from variables
      return createTask(projectId, payload);
    },
    // onSuccess receives data and the variables passed to mutate
    onSuccess: (data, variables) => {
      // Hook's internal success logic
      toast.success(`Task "${data.title}" created successfully!`);
      // Invalidate using the projectId from variables
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(variables.projectId),
      });
      // Call the onSuccess callback passed from the component, if any
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      // Hook's internal error logic
      toast.error(`Failed to create task: ${error.message}`);
      // Call the onError callback passed from the component, if any
      options?.onError?.(error);
    },
    // We don't need onMutate or onSettled for this simple case yet
  });
};

/**
 * Custom hook for deleting a task.
 * Encapsulates the useMutation logic for task deletion.
 * @param projectId The ID of the project the task belongs to (needed for query invalidation).
 * @param options Optional callbacks like onSuccess, onError.
 */
export const useDeleteTask = (
  projectId: number | undefined,
  options?: { onSuccess?: () => void; onError?: (error: Error) => void }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    // The mutation function now expects only the taskId, as projectId is known from the hook's scope
    mutationFn: (taskId: number) => {
      // ProjectId is needed for invalidation, but not for the API call itself
      if (typeof projectId !== "number") {
        // Still useful to have projectId for invalidation context
        return Promise.reject(
          new Error("Project ID context is required for invalidation.")
        );
      }
      // Call deleteTask API function with only taskId
      return deleteTask(taskId);
    },
    onSuccess: () => {
      // Hook's internal success logic
      toast.success("Task deleted successfully!");
      // Invalidate the tasks query, potentially refined by the project ID
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      // Call the onSuccess callback passed from the component, if any
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      // Hook's internal error logic
      toast.error(`Failed to delete task: ${error.message}`);
      // Call the onError callback passed from the component, if any
      options?.onError?.(error);
    },
  });
}; // Added missing closing brace from previous error description

// Removed duplicate imports below

/**
 * Custom hook for updating an existing task.
 * Encapsulates the useMutation logic for task updates.
 * @param projectId The ID of the project the task belongs to (needed for query invalidation).
 * @param options Optional callbacks like onSuccess, onError.
 */
export const useUpdateTask = (
  projectId: number | undefined,
  options?: {
    onSuccess?: (updatedTask: Task) => void;
    onError?: (error: Error) => void;
  }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    // The mutation function expects an object with taskId and the update payload
    mutationFn: (variables: {
      taskId: number;
      taskData: UpdateTaskPayload;
    }) => {
      const { taskId, taskData } = variables;
      // Project ID is needed for the API call now, not just invalidation
      if (typeof projectId !== "number") {
        return Promise.reject(
          new Error("Project ID is required to update task.")
        );
      }
      // Pass projectId, taskId, and taskData to the API function
      return updateTask(projectId, taskId, taskData);
    },
    onSuccess: (updatedTask) => {
      // Hook's internal success logic
      toast.success(`Task "${updatedTask.title}" updated successfully!`);
      // Invalidate the tasks query, potentially refined by the project ID
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      // Optional: Update the specific task query cache if you have one (e.g., queryKeys.task(updatedTask.id))
      // queryClient.setQueryData(queryKeys.task(updatedTask.id), updatedTask); // Assuming queryKeys.task exists
      // Call the onSuccess callback passed from the component, if any
      options?.onSuccess?.(updatedTask);
    },
    onError: (error: Error) => {
      // Hook's internal error logic
      toast.error(`Failed to update task: ${error.message}`);
      // Call the onError callback passed from the component, if any
      options?.onError?.(error);
    },
  });
};

// Add other task-related hooks here as needed (e.g., useTaskById)
