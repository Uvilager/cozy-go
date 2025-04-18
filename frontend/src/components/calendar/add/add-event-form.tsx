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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import { Calendar } from "@/components/ui/calendar"; // shadcn calendar
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects"; // Import useProjects hook

// Define the form schema using Zod
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().optional(),
  dueDate: z.date({ required_error: "A due date is required." }),
  startTime: z.string().optional(), // Optional time string e.g., "14:30"
  endTime: z.string().optional(), // Optional time string e.g., "15:00"
  // Add projectId field - make it required
  projectId: z
    .number({ required_error: "Project is required." })
    .int()
    .positive({ message: "Project is required." }),
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
  // projectIds prop is no longer needed here
}

export default function AddEventForm({
  onSuccess,
  defaultDate,
}: AddEventFormProps) {
  // Fetch projects for the selector
  const { data: projects, isLoading: isLoadingProjects } = useProjects();

  // Use the updated hook (doesn't need projectId initially)
  const createTaskMutation = useCreateTask({
    onSuccess: onSuccess,
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
      projectId: undefined, // Initialize projectId as undefined
    },
  });

  function onSubmit(values: FormData) {
    console.log("Form submitted:", values);

    // Map FormData to the structure expected by the API payload
    const apiPayload = {
      title: values.title,
      description: values.description ?? "",
      due_date: values.dueDate.toISOString(),
      start_time:
        combineDateAndTime(values.dueDate, values.startTime)?.toISOString() ??
        null,
      end_time:
        combineDateAndTime(values.dueDate, values.endTime)?.toISOString() ??
        null,
      // project_id is now part of the form data (values.projectId)
      label: "", // TODO: Add Label selector
      priority: "medium", // TODO: Add Priority selector
      status: "todo",
    };

    // The projectId comes directly from the form values now
    if (!values.projectId) {
      // This should be caught by Zod validation, but double-check
      console.error("Project ID is missing in form values.");
      // Potentially show a toast error
      return;
    }

    // Call the updated mutation, passing payload and projectId
    createTaskMutation.mutate({
      payload: apiPayload,
      projectId: values.projectId,
    });
    // onSuccess/onError are handled by the hook's configuration
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

        {/* Project Selector */}
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))} // Ensure value is number
                defaultValue={field.value?.toString()} // Convert number to string for Select
                disabled={isLoadingProjects}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingProjects ? (
                    <SelectItem value="loading" disabled>
                      Loading projects...
                    </SelectItem>
                  ) : (
                    projects?.map((project) => (
                      <SelectItem
                        key={project.id}
                        value={project.id.toString()}
                      >
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
