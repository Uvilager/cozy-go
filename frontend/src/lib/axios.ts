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
// Import js-cookie
import Cookies from "js-cookie";

// Request interceptor ONLY for the default instance (Task Service)
axiosInstance.interceptors.request.use(
  (config) => {
    // This interceptor runs for requests made using this instance.
    // Check if running on the client-side before accessing cookies.
    if (typeof window !== "undefined") {
      const token = Cookies.get("authToken"); // Use the same cookie name as middleware/login hook
      console.log(
        "Client-side interceptor check, token:",
        token ? "found" : "undefined"
      );
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          "Task Service Interceptor (Client): Added auth token from cookie."
        );
      } else {
        console.log(
          "Task Service Interceptor (Client): No auth token found in cookie."
        );
      }
    } else {
      // Running server-side (e.g., SSR, RSC data fetching)
      // Cannot access document.cookie here.
      // Auth for server-side requests must be handled differently
      // (e.g., reading cookie from request headers and passing token explicitly).
      console.log("Task Service Interceptor (Server): Skipping cookie check.");
    }
    // Ensure config is always returned after the if/else block
    return config;
  },
  (error) => {
    // This is the correct error handler for the request interceptor
    console.error("Task Service Interceptor Request Error:", error);
    return Promise.reject(error);
  }
);
// Removed duplicated else block, return statement, and error handler

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
