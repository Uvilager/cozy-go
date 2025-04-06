import axiosInstance from "../axios";

// Define Project type
export interface Project {
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
