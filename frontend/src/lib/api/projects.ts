import axiosInstance from "../axios";

// Define Project type
export interface Project {
  id: number;
  name: string;
  description?: string; // Make description optional as per backend struct
  created_at: string; // Assuming time.Time serializes to string (e.g., ISO 8601)
  updated_at: string;
}

// Define the type for the data needed to create a project
export interface CreateProjectPayload {
  name: string;
  description?: string; // Optional description
}

// Define the type for the data needed to update a project
// Usually a partial version of the create payload
export type UpdateProjectPayload = Partial<CreateProjectPayload>;

/**
 * Fetches all projects from the API.
 * @param token Optional auth token for server-side requests.
 * @returns A promise that resolves to an array of projects.
 */
export const getProjects = async (token?: string): Promise<Project[]> => {
  try {
    console.log("API: Fetching projects...");
    // Configure headers based on token presence
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("getProjects: Using provided token for server-side request.");
    } // Client-side calls will rely on the interceptor

    const response = await axiosInstance.get<Project[]>("/projects", {
      headers,
    });

    // Check for successful status code
    if (response.status !== 200) {
      console.warn(
        `API: Unexpected status code ${response.status} fetching projects.`
      );
      // Depending on requirements, you might throw an error or return empty
      // throw new Error(`Failed to fetch projects: Status ${response.status}`);
      return []; // Return empty array for non-200 status
    }

    console.log("API: Projects fetched successfully:", response.data);
    // Basic check if data is an array (can be enhanced later)
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("API Error fetching projects:", error);
    // Re-throw the error to be handled by React Query or the caller
    throw error;
  }
};

/**
 * Creates a new project.
 * @param projectData The data for the new project (name, description).
 * @param token Optional auth token for server-side requests (if needed, though creation is usually client-side).
 * @returns A promise that resolves to the newly created project.
 */
export const createProject = async (
  projectData: CreateProjectPayload,
  token?: string
): Promise<Project> => {
  try {
    console.log("API: Creating project...", projectData);
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // Ensure description is not sent if empty, matching backend omitempty
    const payload = { ...projectData };
    if (payload.description === "") {
      delete payload.description;
    }

    const response = await axiosInstance.post<Project>("/projects", payload, {
      headers,
    });

    // Check for successful creation status code (usually 201 Created)
    if (response.status !== 201) {
      console.warn(
        `API: Unexpected status code ${response.status} creating project. Expected 201.`
      );
      throw new Error(
        `Failed to create project: Status ${
          response.status
        }, Data: ${JSON.stringify(response.data)}`
      );
    }

    console.log("API: Project created successfully:", response.data);
    // TODO: Add validation for response.data structure if needed
    return response.data;
  } catch (error) {
    console.error("API Error creating project:", error);
    throw error; // Re-throw to be handled by React Query mutation
  }
};

/**
 * Updates an existing project.
 * @param projectId The ID of the project to update.
 * @param projectData The data to update the project with.
 * @param token Optional auth token.
 * @returns A promise that resolves to the updated project.
 */
export const updateProject = async (
  projectId: number,
  projectData: UpdateProjectPayload,
  token?: string
): Promise<Project> => {
  if (!projectId) {
    throw new Error("Project ID is required to update a project.");
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(`API: Updating project ${projectId}...`, projectData);
    // Ensure description is not sent if empty, matching backend omitempty
    const payload = { ...projectData };
    if (payload.description === "") {
      delete payload.description;
    }

    const response = await axiosInstance.put<Project>(
      `/projects/${projectId}`,
      payload,
      { headers }
    );

    // Check for successful update status code (usually 200 OK)
    if (response.status !== 200) {
      console.warn(
        `API: Unexpected status code ${response.status} updating project ${projectId}. Expected 200.`
      );
      throw new Error(
        `Failed to update project: Status ${
          response.status
        }, Data: ${JSON.stringify(response.data)}`
      );
    }

    console.log(
      `API: Project ${projectId} updated successfully:`,
      response.data
    );
    // TODO: Add validation for response.data structure if needed
    return response.data;
  } catch (error) {
    console.error(`API Error updating project ${projectId}:`, error);
    throw error; // Re-throw to be handled by React Query mutation
  }
};

/**
 * Deletes a specific project.
 * @param projectId The ID of the project to delete.
 * @param token Optional auth token.
 * @returns A promise that resolves when the project is deleted.
 */
export const deleteProject = async (
  projectId: number,
  token?: string
): Promise<void> => {
  if (!projectId) {
    throw new Error("Project ID is required to delete a project.");
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    console.log(`API: Deleting project ${projectId}...`);
    const response = await axiosInstance.delete(`/projects/${projectId}`, {
      headers,
    });

    // Check for successful deletion status codes (usually 200 OK or 204 No Content)
    if (response.status !== 200 && response.status !== 204) {
      console.error(
        `API: Unexpected status code ${response.status} deleting project ${projectId}. Expected 200 or 204.`
      );
      throw new Error(
        `Failed to delete project ${projectId}: Status ${response.status}`
      );
    }

    console.log(
      `API: Project ${projectId} deleted successfully. Status: ${response.status}`
    );
    // No data expected on successful delete
  } catch (error) {
    console.error(`API Error deleting project ${projectId}:`, error);
    throw error; // Re-throw to be handled by React Query mutation
  }
};
