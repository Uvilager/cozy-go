"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parseISO } from "date-fns"; // Import parseISO
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useUpdateTask } from "@/hooks/useTasks"; // Import update hook
import { Task } from "@/components/tasks/data/schema"; // Import Task type

// Define the form schema (can be the same as AddEventForm for now)
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().optional(),
  dueDate: z.date({ required_error: "A due date is required." }),
  startTime: z.string().optional(), // Optional time string e.g., "14:30"
  endTime: z.string().optional(), // Optional time string e.g., "15:00"
  // Add other editable fields if needed
});

type FormData = z.infer<typeof formSchema>;

// Helper to combine date and time string into a Date object
const combineDateAndTime = (
  date: Date,
  timeString: string | undefined | null
): Date | null => {
  if (!timeString) return null;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // Basic HH:mm validation
  if (!timeRegex.test(timeString)) return null;

  const [hours, minutes] = timeString.split(":").map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

// Helper to extract HH:mm time from ISO string or Date
const formatTime = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, "HH:mm");
  } catch (e) {
    console.error("Error formatting time:", e);
    return "";
  }
};

interface EditEventFormProps {
  task: Task; // The task being edited
  onSuccess: () => void; // Callback to close dialog on success
}

export default function EditEventForm({ task, onSuccess }: EditEventFormProps) {
  // Assuming projectId is part of the task object passed from backend
  const updateTaskMutation = useUpdateTask(task.project_id, {
    onSuccess: onSuccess,
    // onError handled by hook
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    // Pre-fill form with existing task data
    defaultValues: {
      title: task.title || "",
      description: task.description || "",
      dueDate: task.due_date ? parseISO(task.due_date) : undefined,
      startTime: formatTime(task.start_time),
      endTime: formatTime(task.end_time),
    },
  });

  // Reset form if the task prop changes (e.g., opening dialog for a different task)
  useEffect(() => {
    form.reset({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.due_date ? parseISO(task.due_date) : undefined,
      startTime: formatTime(task.start_time),
      endTime: formatTime(task.end_time),
    });
  }, [task, form]);

  function onSubmit(values: FormData) {
    console.log("Edit Form submitted:", values);

    // Map FormData to the UpdateTaskPayload structure
    const apiPayload = {
      title: values.title,
      description: values.description ?? null, // Send null if empty
      due_date: values.dueDate?.toISOString() ?? null,
      start_time:
        combineDateAndTime(values.dueDate, values.startTime)?.toISOString() ??
        null,
      end_time:
        combineDateAndTime(values.dueDate, values.endTime)?.toISOString() ??
        null,
      // Include other fields from the original task that aren't edited by this form
      // but might be required by the UpdateTaskPayload or backend validation
      // (e.g., status, priority, label might need to be included if not editable here)
      status: task.status, // Pass existing status
      priority: task.priority, // Pass existing priority
      label: task.label ?? null, // Pass existing label
    };

    updateTaskMutation.mutate(
      { taskId: task.id, taskData: apiPayload },
      {
        onSuccess: () => {
          console.log("Task updated successfully!");
          onSuccess(); // Close the dialog
        },
        onError: (error) => {
          console.error("Failed to update task:", error);
          // TODO: Show user-friendly error message
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Event or Task Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Field */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time (HH:mm)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time (HH:mm)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TODO: Add other editable fields if needed */}

        <Button
          type="submit"
          disabled={updateTaskMutation.isPending}
          className="w-full"
        >
          {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
