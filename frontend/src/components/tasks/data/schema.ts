import { z } from "zod";

// This schema should reflect the full Task object returned by the backend API
export const taskSchema = z.object({
  id: z.number(),
  project_id: z.number(), // Added field from backend
  title: z.string(),
  description: z.string().nullish(), // Added field from backend (optional/nullable)
  status: z.string(), // Consider z.enum if using custom types consistently
  label: z.string().nullish(), // Added field from backend (optional/nullable)
  priority: z.string(), // Consider z.enum
  due_date: z.string().nullish(), // Assuming string format like ISO 8601, nullable
  start_time: z.string().nullish(), // Optional start time (ISO 8601 string)
  end_time: z.string().nullish(), // Optional end time (ISO 8601 string)
  created_at: z.string(), // Assuming string format
  updated_at: z.string(), // Assuming string format
});

// This type now includes all fields from the backend
export type Task = z.infer<typeof taskSchema>;
