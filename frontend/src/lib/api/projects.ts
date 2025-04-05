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
    console.log("API: Projects fetched successfully:", response.data);
    // Ensure we return an array even if the API unexpectedly returns something else
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("API Error fetching projects:", error);
    // Re-throw the error to be handled by React Query or the caller
    throw error;
  }
};
