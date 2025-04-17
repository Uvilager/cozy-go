import { useMutation, useQuery } from "@tanstack/react-query"; // Add useQuery
import { useRouter } from "next/navigation"; // For redirection
import {
  login,
  getMe, // Import getMe API function
  register,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  User, // Import User type
} from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import Cookies from "js-cookie"; // Import js-cookie
import { queryKeys } from "@/lib/queryKeys"; // Import queryKeys

/**
 * Custom hook for user login.
 * Handles the login mutation, updates auth state on success, and redirects.
 */
export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth); // Get the setAuth action

  return useMutation<AuthResponse, Error, LoginPayload>({
    mutationFn: login,
    onSuccess: (data) => {
      // 1. Update Zustand store
      setAuth(data.token, data.user);
      // 2. Set cookie for middleware (expires in 7 days, adjust as needed)
      Cookies.set("authToken", data.token, { expires: 7, path: "/" }); // Use the same name as in middleware
      toast.success("Login successful!");
      // 3. Redirect
      router.push("/tasks");
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

import { useQueryClient } from "@tanstack/react-query"; // Import queryClient hook

// Optional: Add a useLogout hook if logout requires API calls or complex client-side cleanup
export const useLogout = () => {
  const queryClient = useQueryClient(); // Get query client instance
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  const logoutAction = () => {
    // Perform any necessary API calls for logout here (if applicable)
    // e.g., await axiosInstance.post('/auth/logout');

    // 1. Clear the auth state in Zustand
    clearAuth();
    // 2. Remove the auth cookie
    Cookies.remove("authToken", { path: "/" }); // Use the same name and path
    // 3. Remove the user query data from React Query cache
    queryClient.removeQueries({ queryKey: queryKeys.user });
    toast.success("Logged out successfully.");
    // 4. Redirect to login page
    router.push("/login");
  };

  return logoutAction;
};

/**
 * Custom hook to fetch the current user's data.
 * Uses React Query to manage fetching, caching, and state.
 */
export const useUser = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); // Check auth status

  return useQuery<User, Error>({
    queryKey: queryKeys.user,
    queryFn: () => getMe(), // Wrap getMe call
    enabled: isAuthenticated, // Only run the query if the user is authenticated (has token)
    staleTime: 5 * 60 * 1000, // 5 minutes - how long data is considered fresh
    gcTime: 60 * 60 * 1000, // 1 hour - Renamed from cacheTime in v5
    retry: 1, // Retry once on error
    // Optional: Add error handling specific to this query if needed
    // onError: (error) => {
    //   console.error("Error fetching user data:", error);
    //   // Maybe clear auth state if token is invalid (e.g., 401 error)?
    // },
  });
};
