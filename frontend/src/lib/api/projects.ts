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

/**
 * Fetches all projects from the API.
 * @returns A promise that resolves to an array of projects.
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    console.log("API: Fetching projects...");
    const response = await axiosInstance.get<Project[]>("/projects");

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
 * @returns A promise that resolves to the newly created project.
 */
export const createProject = async (
  projectData: CreateProjectPayload
): Promise<Project> => {
  try {
    console.log("API: Creating project...", projectData);
    // Ensure description is not sent if empty, matching backend omitempty
    const payload = { ...projectData };
    if (payload.description === "") {
      delete payload.description;
    }

    const response = await axiosInstance.post<Project>("/projects", payload);

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
