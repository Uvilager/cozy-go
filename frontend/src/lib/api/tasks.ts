import axiosInstance from "../axios";
import { Task } from "@/components/tasks/data/schema"; // Assuming Task type is here

// Define the type for the data needed to create a task
export interface CreateTaskPayload {
  title: string;
  status: string;
  priority?: string;
  label?: string;
  description?: string;
}

// Define the type for the data needed to update a task
export type UpdateTaskPayload = Partial<
  Omit<Task, "id" | "project_id" | "created_at" | "updated_at">
>;

/**
 * Fetches tasks for a specific project ID from the API.
 */
export const getTasksByProject = async (projectId: number): Promise<Task[]> => {
  if (!projectId) {
    console.warn("API: getTasksByProject called without projectId.");
    return [];
  }
  try {
    console.log(`API: Fetching tasks for project ${projectId}...`);
    const response = await axiosInstance.get<Task[]>(
      `/projects/${projectId}/tasks`
    );
    console.log(
      `API: Tasks for project ${projectId} fetched successfully:`,
      response.data
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`API Error fetching tasks for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Creates a new task for a specific project ID.
 */
export const createTask = async (
  projectId: number,
  taskData: CreateTaskPayload
): Promise<Task> => {
  if (!projectId) {
    throw new Error("Project ID is required to create a task.");
  }
  try {
    console.log(`API: Creating task for project ${projectId}...`, taskData);
    const payload: Partial<CreateTaskPayload> = { ...taskData };
    if (payload.description === "") delete payload.description;
    if (payload.label === "") delete payload.label;

    const response = await axiosInstance.post<Task>(
      `/projects/${projectId}/tasks`,
      payload
    );
    console.log(
      `API: Task for project ${projectId} created successfully:`,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(`API Error creating task for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific task.
 */
export const deleteTask = async (
  // projectId is not needed for the API call itself, but might be useful contextually if needed later
  // projectId: number,
  taskId: number
): Promise<void> => {
  if (!taskId) {
    throw new Error("Task ID is required to delete a task.");
  }
  try {
    console.log(`API: Deleting task ${taskId}...`);
    const response = await axiosInstance.delete(`/tasks/${taskId}`);
    console.log(
      `API: Task ${taskId} deleted successfully. Status: ${response.status}`
    );
    if (response.status !== 200 && response.status !== 204) {
      console.warn(`API: Unexpected status code ${response.status} on delete.`);
    }
  } catch (error) {
    console.error(`API Error deleting task ${taskId}:`, error);
    throw error;
  }
};

/**
 * Updates an existing task.
 */
export const updateTask = async (
  projectId: number,
  taskId: number,
  taskData: UpdateTaskPayload
): Promise<Task> => {
  if (!projectId || !taskId) {
    throw new Error("Project ID and Task ID are required to update a task.");
  }
  try {
    console.log(
      `API: Updating task ${taskId} in project ${projectId}...`,
      taskData
    );
    const response = await axiosInstance.put<Task>(
      `/projects/${projectId}/tasks/${taskId}`,
      taskData
    );
    console.log(
      `API: Task ${taskId} in project ${projectId} updated successfully:`,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(
      `API Error updating task ${taskId} in project ${projectId}:`,
      error
    );
    throw error;
  }
};
