"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns"; // For date picker display
import { CalendarIcon } from "lucide-react"; // Or your preferred icon

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
import { Calendar } from "@/components/ui/calendar"; // shadcn calendar
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/hooks/useTasks"; // Assuming useTasks hook handles mutations

// Define the form schema using Zod
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().optional(),
  dueDate: z.date({ required_error: "A due date is required." }),
  startTime: z.string().optional(), // Optional time string e.g., "14:30"
  endTime: z.string().optional(), // Optional time string e.g., "15:00"
  // Add other fields as needed: projectId, label, priority etc.
});

type FormData = z.infer<typeof formSchema>;

// Helper function to combine date and time string into a Date object
// Returns null if timeString is invalid or empty
const combineDateAndTime = (
  date: Date,
  timeString: string | undefined
): Date | null => {
  if (!timeString) return null;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // Basic HH:mm validation
  if (!timeRegex.test(timeString)) return null;

  const [hours, minutes] = timeString.split(":").map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0); // Set hours and minutes, reset seconds/ms
  return newDate;
};

interface AddEventFormProps {
  onSuccess: () => void; // Callback to close dialog on success
  defaultDate?: Date; // Optional date to pre-fill
  projectIds: number[]; // Changed from projectId to projectIds array (filter context)
}

export default function AddEventForm({
  onSuccess,
  defaultDate,
  projectIds, // Use projectIds prop
}: AddEventFormProps) {
  // Determine if a single project is pre-selected by the filter
  const singleProjectId = projectIds.length === 1 ? projectIds[0] : undefined;

  // TODO: If singleProjectId is undefined, the form should ideally render a
  // mandatory project selector dropdown. For now, useCreateTask might default
  // or error, and submission logic below handles it partially.

  const createTaskMutation = useCreateTask(singleProjectId, {
    // Pass the determined single project ID (or undefined)
    // Pass the onSuccess callback from props to the hook's options
    onSuccess: onSuccess,
    // onError is handled internally by the hook (shows toast), but could add more here if needed
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: defaultDate ?? undefined,
      // Pre-fill startTime if defaultDate has a non-midnight hour
      startTime:
        defaultDate && defaultDate.getHours() !== 0
          ? format(defaultDate, "HH:mm")
          : "",
      endTime: "", // Keep endTime empty initially
      // Initialize other fields
    },
  });

  function onSubmit(values: FormData) {
    console.log("Form submitted:", values);

    // TODO: Map FormData to the structure expected by your API
    // This might involve formatting dates/times, adding projectId etc.
    const apiPayload = {
      title: values.title,
      description: values.description ?? "", // Ensure description is string or empty string
      due_date: values.dueDate.toISOString(), // Keep due date as the primary date
      // Combine date and time, convert to ISO string or null
      start_time:
        combineDateAndTime(values.dueDate, values.startTime)?.toISOString() ??
        null,
      end_time:
        combineDateAndTime(values.dueDate, values.endTime)?.toISOString() ??
        null,
      // Map other fields...
      // Use the determined single project ID.
      // TODO: If singleProjectId is undefined, this should ideally come from
      // a mandatory project selector field within this form.
      project_id: singleProjectId ?? 0, // Sending 0 might cause backend error if no project selected
      label: "", // TODO: Add Label selector
      priority: "medium", // TODO: Add Priority selector
      status: "todo",
    };

    createTaskMutation.mutate(apiPayload, {
      onSuccess: () => {
        console.log("Task created successfully!");
        onSuccess(); // Close the dialog
        // Query invalidation is likely handled within the useCreateTask hook
      },
      onError: (error) => {
        console.error("Failed to create task:", error);
        // TODO: Show user-friendly error message
      },
    });

    // Add a check before mutating if a project ID is required and wasn't determined
    // TODO: This check should be more robust if a project selector is added.
    if (singleProjectId === undefined) {
      console.error(
        "Cannot submit task without a project ID (or multiple projects selected in filter)"
      );
      // Optionally show a toast error to the user
      // toast.error("Please select a project for the task.");
      return; // Prevent submission
    }

    createTaskMutation.mutate(apiPayload);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        format(field.value, "PPP") // Example format: Dec 31, 2024
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
                    // disabled={(date) => date < new Date("1900-01-01")} // Optional: disable past dates
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Basic Time Inputs (Consider dedicated Time Picker component later) */}
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

        {/* TODO: Conditionally render a Project Selector FormField here */}
        {/* if singleProjectId is undefined */}
        {/* <FormField control={form.control} name="projectId" render={...} /> */}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional description..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TODO: Add other fields like Project Selector, Priority, Label etc. */}

        <Button
          type="submit"
          disabled={createTaskMutation.isPending}
          className="w-full"
        >
          {createTaskMutation.isPending ? "Adding..." : "Add Event"}
        </Button>
      </form>
    </Form>
  );
}
