import axios from "axios";

// --- Task Service Axios Instance (Default Export) ---
const TASK_SERVICE_URL =
  process.env.NEXT_PUBLIC_TASK_SERVICE_URL || "http://localhost:8081";

const axiosInstance = axios.create({
  baseURL: TASK_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Auth Service Axios Instance (Named Export) ---
const AUTH_SERVICE_URL =
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8080"; // Default to 8000

export const authAxiosInstance = axios.create({
  baseURL: AUTH_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Interceptors ---
// Import the Zustand store
import { useAuthStore } from "@/store/authStore";

// Request interceptor ONLY for the default instance (Task Service)
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from Zustand store *without* subscribing to changes
    // This is important for interceptors which run outside React components
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Task Service Interceptor: Added auth token.");
    } else {
      console.log("Task Service Interceptor: No auth token found.");
    }
    return config;
  },
  (error) => {
    console.error("Task Service Interceptor Request Error:", error);
    return Promise.reject(error);
  }
);

// Note: No interceptor applied to authAxiosInstance by default.

// Example response interceptor for global error handling (can be applied to both instances if needed)
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.error("API call error:", error);
//     // Handle specific error statuses globally if needed
//     // if (error.response?.status === 401) { ... redirect to login ... }
//     return Promise.reject(error);
//   }
// );

export default axiosInstance;
