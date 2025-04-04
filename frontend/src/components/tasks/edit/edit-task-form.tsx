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
import { priorities, statuses, labels } from "../data/data"; // Adjusted import path

// Define the Zod schema for the edit task form (can be same as add)
// Include ID if needed for submission, though often it's passed separately
const editTaskFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(255),
  description: z.string().optional(),
  status: z.string().min(1, { message: "Status is required." }),
  label: z.string().optional(),
  priority: z.string().min(1, { message: "Priority is required." }),
  dueDate: z.date().optional(),
});

export type EditTaskFormValues = z.infer<typeof editTaskFormSchema>;

interface EditTaskFormProps {
  onSubmit: (values: EditTaskFormValues) => void;
  isSubmitting: boolean;
  defaultValues: Partial<EditTaskFormValues>; // Default values are required for editing
}

export function EditTaskForm({
  onSubmit,
  isSubmitting,
  defaultValues,
}: EditTaskFormProps) {
  const form = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskFormSchema),
    defaultValues: defaultValues, // Use provided default values
    mode: "onChange", // Optional: Trigger validation on change
  });

  // Watch for changes if needed, e.g., for debugging
  // React.useEffect(() => {
  //   const subscription = form.watch((value, { name, type }) =>
  //     console.log(value, name, type)
  //   );
  //   return () => subscription.unsubscribe();
  // }, [form.watch]);

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
                  // Ensure value is handled correctly for optional fields
                  value={field.value ?? ""}
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
                  defaultValue={field.value ?? ""}
                >
                  {" "}
                  {/* Handle null/undefined default */}
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
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
