import axios from "axios";

// Determine the base URL for the task service API
// Use environment variable if available, otherwise default to localhost
const API_URL =
  process.env.NEXT_PUBLIC_TASK_SERVICE_URL || "http://localhost:8081";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Later, we can add interceptors here for authentication, logging, etc.
// For example:
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken'); // Or get token from context/store
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Example response interceptor for global error handling
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
