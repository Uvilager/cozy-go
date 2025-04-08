import { authAxiosInstance } from "../axios"; // Import the named instance

// Define the expected payload for login
export interface LoginPayload {
  email: string;
  password?: string; // Password might be optional if using social logins later
}

// Define the expected payload for registration based on feedback
export interface RegisterPayload {
  Username: string; // Changed from name/added
  Email: string; // Changed case
  Password?: string; // Changed case, kept optional for consistency
}

// Define a basic User type (adjust based on what your API returns on LOGIN)
export interface User {
  id: number; // Or string, depending on your backend
  email: string;
  // Add other relevant user fields (name, roles, etc.)
}

// Define the expected response structure after successful login/registration
export interface AuthResponse {
  token: string;
  user: User; // Include user details in the response
}

/**
 * Logs in a user.
 * @param credentials The user's login credentials.
 * @returns A promise that resolves to the auth response (token and user).
 */
export const login = async (
  credentials: LoginPayload
): Promise<AuthResponse> => {
  try {
    console.log("API: Attempting login...", credentials.email);
    // Adjust endpoint '/auth/login' if your auth-service uses a different path
    const response = await authAxiosInstance.post<AuthResponse>( // Use auth instance
      "/login", // Assuming endpoint is /login on auth service
      credentials
    );

    // Basic validation of response structure (can be enhanced)
    if (!response.data || !response.data.token || !response.data.user) {
      throw new Error("Invalid response structure from login API");
    }

    console.log("API: Login successful for:", response.data.user.email);
    return response.data;
  } catch (error: unknown) {
    console.error("API Error logging in:", error);

    // Type guard to check if error is an AxiosError
    if (error instanceof Error && "response" in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMessage =
        axiosError.response?.data?.message || error.message || "Login failed";
      throw new Error(errorMessage);
    }

    // Fallback for unknown error types
    throw new Error("An unknown error occurred during login.");
  }
};

/**
 * Registers a new user.
 * @param userData The user's registration data (Username, Email, Password).
 * @returns A promise that resolves to the success message object.
 */
export const register = async (
  userData: RegisterPayload
): Promise<{ message: string }> => {
  // Note: Changed return type from AuthResponse
  try {
    console.log("API: Attempting registration...", userData.Username);
    // Adjust endpoint '/auth/register' if your auth-service uses a different path
    const response = await authAxiosInstance.post<{ message: string }>( // Use auth instance
      "/register", // Assuming endpoint is /register on auth service
      userData // Sending Username, Email, Password
    );

    // Check for successful status code (201 Created)
    // Axios throws for non-2xx/3xx, but we can double-check status if needed
    if (response.status !== 201) {
      throw new Error(
        `Registration failed: Unexpected status code ${response.status}`
      );
    }

    // Basic validation of response message
    if (!response.data || typeof response.data.message !== "string") {
      console.warn(
        "API Register: Response data or message missing/invalid",
        response.data
      );
      // Still treat as success based on status code, but return a default message
      return { message: "Registration successful (message missing)" };
      // OR: throw new Error("Invalid response structure from register API");
    }

    console.log("API: Registration successful:", response.data.message);
    return response.data; // Return { message: "..." }
  } catch (error: unknown) {
    console.error("API Error registering:", error);

    // Type guard to check if error is an AxiosError
    if (error instanceof Error && "response" in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        error.message ||
        "Registration failed";
      throw new Error(errorMessage);
    }

    // Fallback for unknown error types
    throw new Error("An unknown error occurred during registration.");
  }
};

// Optional: Add functions for logout (if it requires an API call), password reset, etc.
