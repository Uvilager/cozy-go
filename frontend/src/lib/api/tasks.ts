import axiosInstance from "../axios";
import { Task } from "@/components/tasks/data/schema"; // Assuming Task type is here

// Define the type for the data needed to create a task
export interface CreateTaskPayload {
  title: string;
  status: string;
  priority?: string;
  label?: string;
  description?: string;
  due_date?: string | null; // ISO string or null
  start_time?: string | null; // ISO string or null
  end_time?: string | null; // ISO string or null
}

// Define the type for the data needed to update a task
export type UpdateTaskPayload = Partial<
  Omit<Task, "id" | "project_id" | "created_at" | "updated_at">
>;

/**
 * Fetches tasks for a specific project ID from the API.
 * @param projectId The ID of the project.
 * @param token Optional auth token for server-side requests.
 */
export const getTasksByProject = async (
  projectId: number,
  token?: string
): Promise<Task[]> => {
  if (!projectId) {
    console.warn("API: getTasksByProject called without projectId.");
    return [];
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(`API: Fetching tasks for project ${projectId}...`);
    const response = await axiosInstance.get<Task[]>(
      `/projects/${projectId}/tasks`,
      { headers }
    );

    // Check for successful status code
    if (response.status !== 200) {
      console.warn(
        `API: Unexpected status code ${response.status} fetching tasks for project ${projectId}.`
      );
      // throw new Error(`Failed to fetch tasks: Status ${response.status}`);
      return []; // Return empty array for non-200 status
    }

    console.log(
      `API: Tasks for project ${projectId} fetched successfully:`,
      response.data
    );
    // Basic check if data is an array (can be enhanced later)
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`API Error fetching tasks for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Creates a new task for a specific project ID.
 * @param projectId The ID of the project.
 * @param taskData The data for the new task.
 * @param token Optional auth token.
 */
export const createTask = async (
  projectId: number,
  taskData: CreateTaskPayload,
  token?: string
): Promise<Task> => {
  if (!projectId) {
    throw new Error("Project ID is required to create a task.");
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(`API: Creating task for project ${projectId}...`, taskData);
    const payload: Partial<CreateTaskPayload> = { ...taskData };
    // Remove empty optional fields from payload before sending
    if (payload.description === "") delete payload.description;
    if (payload.label === "") delete payload.label;
    if (payload.priority === "") delete payload.priority; // Assuming empty means not set
    // Null values for dates/times should be preserved if explicitly set to null

    const response = await axiosInstance.post<Task>(
      `/projects/${projectId}/tasks`,
      payload,
      { headers }
    );

    // Check for successful creation status code
    if (response.status !== 201) {
      // 201 Created is typical for successful POST
      console.warn(
        `API: Unexpected status code ${response.status} creating task for project ${projectId}. Expected 201.`
      );
      // Throw an error because the caller expects a Task object
      throw new Error(
        `Failed to create task: Status ${
          response.status
        }, Data: ${JSON.stringify(response.data)}`
      );
    }

    console.log(
      `API: Task for project ${projectId} created successfully:`,
      response.data
    );
    // We should ideally validate response.data structure here later
    return response.data;
  } catch (error) {
    console.error(`API Error creating task for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific task.
 * @param taskId The ID of the task to delete.
 * @param token Optional auth token.
 */
export const deleteTask = async (
  taskId: number,
  token?: string
): Promise<void> => {
  if (!taskId) {
    throw new Error("Task ID is required to delete a task.");
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(`API: Deleting task ${taskId}...`);
    const response = await axiosInstance.delete(`/tasks/${taskId}`, {
      headers,
    });
    // Check for successful deletion status codes
    if (response.status !== 200 && response.status !== 204) {
      // 200 OK or 204 No Content are typical for successful DELETE
      console.error(
        `API: Unexpected status code ${response.status} deleting task ${taskId}. Expected 200 or 204.`
      );
      throw new Error(
        `Failed to delete task ${taskId}: Status ${response.status}`
      );
    }

    console.log(
      `API: Task ${taskId} deleted successfully. Status: ${response.status}`
    );
  } catch (error) {
    console.error(`API Error deleting task ${taskId}:`, error);
    throw error;
  }
};

/**
 * Updates an existing task.
 * @param projectId The ID of the project the task belongs to.
 * @param taskId The ID of the task to update.
 * @param taskData The data to update the task with.
 * @param token Optional auth token.
 */
export const updateTask = async (
  projectId: number,
  taskId: number,
  taskData: UpdateTaskPayload,
  token?: string
): Promise<Task> => {
  if (!projectId || !taskId) {
    throw new Error("Project ID and Task ID are required to update a task.");
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(
      `API: Updating task ${taskId} in project ${projectId}...`,
      taskData
    );
    const response = await axiosInstance.put<Task>(
      `/projects/${projectId}/tasks/${taskId}`,
      taskData,
      { headers }
    );

    // Check for successful update status code
    if (response.status !== 200) {
      // 200 OK is typical for successful PUT/PATCH
      console.warn(
        `API: Unexpected status code ${response.status} updating task ${taskId} in project ${projectId}. Expected 200.`
      );
      // Throw an error because the caller expects an updated Task object
      throw new Error(
        `Failed to update task: Status ${
          response.status
        }, Data: ${JSON.stringify(response.data)}`
      );
    }

    console.log(
      `API: Task ${taskId} in project ${projectId} updated successfully:`,
      response.data
    );
    // We should ideally validate response.data structure here later
    return response.data;
  } catch (error) {
    console.error(
      `API Error updating task ${taskId} in project ${projectId}:`,
      error
    );
    throw error;
  }
};
