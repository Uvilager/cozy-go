import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation"; // For redirection
import {
  login,
  register,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
} from "@/lib/api/auth"; // Import API functions and types
import { useAuthStore } from "@/store/authStore"; // Import Zustand store
import { toast } from "sonner"; // For notifications

/**
 * Custom hook for user login.
 * Handles the login mutation, updates auth state on success, and redirects.
 */
export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth); // Get the setAuth action

  return useMutation<AuthResponse, Error, LoginPayload>({
    mutationFn: login, // The API function to call for login
    onSuccess: (data) => {
      // On successful login, update the auth state in Zustand store
      setAuth(data.token, data.user);
      toast.success("Login successful!");
      // Redirect to the tasks page (or dashboard) after successful login
      router.push("/tasks"); // Adjust redirect path if needed
    },
    onError: (error) => {
      // Error is already thrown by the API function, React Query catches it
      // Display the error message using toast
      toast.error(error.message || "Login failed. Please try again.");
      console.error("Login mutation error:", error);
    },
  });
};

/**
 * Custom hook for user registration.
 * Handles the registration mutation.
 * Note: Does not log the user in automatically based on current API design.
 */
export const useRegister = () => {
  const router = useRouter();

  return useMutation<{ message: string }, Error, RegisterPayload>({
    mutationFn: register, // The API function to call for registration
    onSuccess: (data) => {
      // On successful registration, show success message
      toast.success(data.message || "Registration successful!");
      // Redirect to the login page after successful registration
      router.push("/login");
    },
    onError: (error) => {
      // Display the error message using toast
      toast.error(error.message || "Registration failed. Please try again.");
      console.error("Registration mutation error:", error);
    },
  });
};

// Optional: Add a useLogout hook if logout requires API calls or complex client-side cleanup
export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  const logoutAction = () => {
    // Perform any necessary API calls for logout here (if applicable)
    // e.g., await axiosInstance.post('/auth/logout');

    // Clear the auth state in Zustand
    clearAuth();
    toast.success("Logged out successfully.");
    // Redirect to login page
    router.push("/login");
  };

  return logoutAction;
};
