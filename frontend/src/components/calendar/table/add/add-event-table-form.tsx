"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatISO } from "date-fns"; // To format dates for default values

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
// Removed Select imports as status/priority/label are gone

// Define the Zod schema for the add event form (specific for table context if needed)
// calendar_id will be passed separately
const addEventTableFormSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required." }).max(255),
    description: z.string().optional(),
    // Use string for datetime-local input, refine validation if needed
    start_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Start time is required and must be a valid date/time.",
    }),
    end_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "End time is required and must be a valid date/time.",
    }),
    // Add constraint: end_time must be after start_time
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "End time must be after start time.",
    path: ["end_time"], // Attach error to end_time field
  });

export type AddEventTableFormValues = z.infer<typeof addEventTableFormSchema>;

interface AddEventTableFormProps {
  onSubmit: (values: AddEventTableFormValues) => void; // Callback for form submission
  isSubmitting: boolean; // To disable button during submission
  defaultValues?: Partial<AddEventTableFormValues>; // Optional default values
}

// Helper to format date for datetime-local input
const formatDateTimeLocal = (date: Date): string => {
  // datetime-local format is 'YYYY-MM-DDTHH:mm'
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function AddEventTableForm({
  onSubmit,
  isSubmitting,
  defaultValues,
}: AddEventTableFormProps) {
  // Default start time to now, end time to one hour from now
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const form = useForm<AddEventTableFormValues>({
    resolver: zodResolver(addEventTableFormSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      start_time: formatDateTimeLocal(now),
      end_time: formatDateTimeLocal(oneHourLater),
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
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Team Meeting" {...field} />
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add event details, agenda, location..."
                  className="resize-none"
                  {...field}
                  // Ensure field.value is string | undefined
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Start Time Field */}
          {/* TODO: Replace with shadcn Calendar + time picker for better UX */}
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Time Field */}
          {/* TODO: Replace with shadcn Calendar + time picker for better UX */}
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Removed Status, Priority, Label fields */}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding Event..." : "Add Event"}
        </Button>
      </form>
    </Form>
  );
}
