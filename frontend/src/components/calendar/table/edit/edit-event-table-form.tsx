"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
// Removed Select imports

// Define the Zod schema for the edit event form
const editEventTableFormSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required." }).max(255),
    description: z.string().optional(),
    start_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Start time is required and must be a valid date/time.",
    }),
    end_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "End time is required and must be a valid date/time.",
    }),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "End time must be after start time.",
    path: ["end_time"],
  });

export type EditEventTableFormValues = z.infer<typeof editEventTableFormSchema>;

interface EditEventTableFormProps {
  onSubmit: (values: EditEventTableFormValues) => void;
  isSubmitting: boolean;
  defaultValues: Partial<EditEventTableFormValues>; // Default values are required for editing
}

// Helper to format date for datetime-local input (same as in add form)
const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function EditEventTableForm({
  onSubmit,
  isSubmitting,
  defaultValues, // Expecting { title, description, start_time, end_time } as strings
}: EditEventTableFormProps) {
  const form = useForm<EditEventTableFormValues>({
    resolver: zodResolver(editEventTableFormSchema),
    defaultValues: defaultValues, // Use provided default values
    mode: "onChange", // Validate on change for better UX
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
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Start Time Field */}
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
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
