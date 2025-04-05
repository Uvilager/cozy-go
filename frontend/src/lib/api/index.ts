import axiosInstance from "../axios"; // Import the configured Axios instance
import { Task } from "@/components/tasks/data/schema"; // Assuming Task type is here
// Define Project type here or import from a shared types location
export interface Project {
  // Added export keyword
  id: number;
  name: string;
  // Add other relevant project fields if needed
}

/**
 * Fetches all projects from the API.
 * @returns A promise that resolves to an array of projects.
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    console.log("API: Fetching projects...");
    const response = await axiosInstance.get<Project[]>("/projects");
    console.log("API: Projects fetched successfully:", response.data);
    // Ensure we return an array even if the API unexpectedly returns something else
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("API Error fetching projects:", error);
    // Re-throw the error to be handled by React Query or the caller
    throw error;
  }
};

/**
 * Fetches tasks for a specific project ID from the API.
 * @param projectId The ID of the project whose tasks are to be fetched.
 * @returns A promise that resolves to an array of tasks.
 */
export const getTasksByProject = async (projectId: number): Promise<Task[]> => {
  if (!projectId) {
    console.warn("API: getTasksByProject called without projectId.");
    return []; // Return empty array if no projectId is provided
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
    // Ensure we return an array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`API Error fetching tasks for project ${projectId}:`, error);
    throw error;
  }
};

// Define the type for the data needed to create a task
// This should match the expected input of the API and the form values
// Assuming AddTaskFormValues is defined elsewhere or we define it here
// For now, let's use a generic object, but ideally import/define AddTaskFormValues
export interface CreateTaskPayload {
  title: string;
  status: string; // Assuming status is required
  priority?: string; // Optional fields
  label?: string;
  description?: string;
  // Add other fields like dueDate if necessary
}

/**
 * Creates a new task for a specific project ID.
 * @param projectId The ID of the project to add the task to.
 * @param taskData The data for the new task.
 * @returns A promise that resolves to the newly created task.
 */
export const createTask = async (
  projectId: number,
  taskData: CreateTaskPayload
): Promise<Task> => {
  if (!projectId) {
    // Or handle this more gracefully depending on requirements
    throw new Error("Project ID is required to create a task.");
  }
  try {
    console.log(`API: Creating task for project ${projectId}...`, taskData);
    // Clean up empty optional fields before sending
    const payload: Partial<CreateTaskPayload> = { ...taskData };
    if (payload.description === "") delete payload.description;
    if (payload.label === "") delete payload.label;
    // Add similar checks for other optional fields if needed

    const response = await axiosInstance.post<Task>(
      `/projects/${projectId}/tasks`,
      payload
    );
    console.log(
      `API: Task for project ${projectId} created successfully:`,
      response.data
    );
    return response.data; // Axios automatically parses JSON response
  } catch (error) {
    console.error(`API Error creating task for project ${projectId}:`, error);
    throw error; // Re-throw to be handled by useMutation
  }
};

// Add other API functions here as needed (e.g., updateTask, deleteTask, getTaskById, etc.)
