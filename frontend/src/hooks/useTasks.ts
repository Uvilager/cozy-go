import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Consolidate imports
import {
  getProjects,
  getTasksByProject,
  createTask,
  CreateTaskPayload,
  deleteTask,
  updateTask,
  UpdateTaskPayload,
} from "@/lib/api"; // Import API functions
import { queryKeys } from "@/lib/queryKeys"; // Import query keys
import { Task } from "@/components/tasks/data/schema"; // Import Task type (moved to top)
import { toast } from "sonner"; // Import toast

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
 * Custom hook to fetch tasks for a specific project ID.
 * Encapsulates the useQuery logic for fetching tasks.
 * @param projectId The ID of the project whose tasks are to be fetched.
 */
export const useTasksByProject = (projectId: number | undefined) => {
  return useQuery({
    queryKey: queryKeys.tasks(projectId), // Use centralized query key function
    // Only call the API function if projectId is defined and valid
    queryFn: () => {
      if (typeof projectId !== "number") {
        // Return a resolved promise with empty array or throw an error if projectId is invalid/missing
        // This prevents the query from running unnecessarily
        return Promise.resolve([]);
        // Alternatively, you could throw: throw new Error("Project ID is required");
        // But React Query's `enabled` option handles this more gracefully.
      }
      return getTasksByProject(projectId); // Use the API function
    },
    // The query will only run if projectId is a truthy value (i.e., a valid number).
    // This prevents unnecessary API calls when no project is selected.
    enabled: !!projectId && typeof projectId === "number",
    // Optional: Configure staleTime, cacheTime, etc.
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Removed duplicate imports below

/**
 * Custom hook for creating a new task.
 * Encapsulates the useMutation logic for task creation.
 * @param projectId The ID of the project to add the task to.
 * @param options Optional callbacks like onSuccess, onError to be executed *after* the hook's internal handlers.
 */
export const useCreateTask = (
  projectId: number | undefined,
  options?: { onSuccess?: () => void; onError?: (error: Error) => void }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTaskData: CreateTaskPayload) => {
      if (typeof projectId !== "number") {
        // Should be prevented by UI, but double-check
        return Promise.reject(new Error("Project ID is required."));
      }
      return createTask(projectId, newTaskData);
    },
    onSuccess: (data) => {
      // Hook's internal success logic
      toast.success(`Task "${data.title}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
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
      if (typeof projectId !== "number") {
        return Promise.reject(new Error("Project ID is required."));
      }
      return deleteTask(projectId, taskId);
    },
    onSuccess: () => {
      // Hook's internal success logic
      toast.success("Task deleted successfully!");
      // Invalidate the tasks query for the specific project
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
      // Invalidate the tasks query for the specific project
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) });
      // Optional: Update the specific task query cache if you have one (e.g., queryKeys.task(updatedTask.id))
      // queryClient.setQueryData(queryKeys.task(updatedTask.id), updatedTask);
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
