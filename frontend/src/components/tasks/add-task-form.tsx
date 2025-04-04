"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { priorities, statuses, labels } from "./data/data"; // Import options

// Define the Zod schema for the add task form
// Note: We don't include id, project_id, created_at, updated_at as these are handled by the backend or context
const addTaskFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(255),
  description: z.string().optional(),
  status: z.string().min(1, { message: "Status is required." }), // Use string to match backend model before validation
  label: z.string().optional(), // Assuming label can be optional initially
  priority: z.string().min(1, { message: "Priority is required." }), // Assuming priority is required
  dueDate: z.date().optional(), // Example: Add due date if needed
});

export type AddTaskFormValues = z.infer<typeof addTaskFormSchema>;

interface AddTaskFormProps {
  onSubmit: (values: AddTaskFormValues) => void; // Callback for form submission
  isSubmitting: boolean; // To disable button during submission
  defaultValues?: Partial<AddTaskFormValues>; // Optional default values
}

export function AddTaskForm({
  onSubmit,
  isSubmitting,
  defaultValues,
}: AddTaskFormProps) {
  const form = useForm<AddTaskFormValues>({
    resolver: zodResolver(addTaskFormSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      status: "todo", // Default status
      label: "", // Default empty label
      priority: "medium", // Default priority
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Implement user authentication"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add more details about the task..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          {/* Status Field */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center">
                          {status.icon && (
                            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority Field */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center">
                          {priority.icon && (
                            <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Label Field */}
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select label (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Removed SelectItem with value="" */}
                    {labels.map((label) => (
                      <SelectItem key={label.value} value={label.value}>
                        {label.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* TODO: Add Due Date Field if needed */}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding Task..." : "Add Task"}
        </Button>
      </form>
    </Form>
  );
}
