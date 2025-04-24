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
import { useUpdateEvent } from "@/hooks/useEvents"; // Import the actual hook
import { Event, UpdateEventPayload } from "@/lib/api/events"; // Import event types

// Define the form schema using Zod based on UpdateEventPayload
const formSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required." }),
    description: z.string().optional(),
    startDate: z.date({ required_error: "Start date is required." }),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Invalid time format (HH:mm)",
    }), // Required HH:mm format
    endDate: z.date({ required_error: "End date is required." }),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Invalid time format (HH:mm)",
    }), // Required HH:mm format
    location: z.string().optional(),
    color: z.string().optional(), // Consider adding validation (e.g., hex code regex)
  })
  .refine(
    (data) => {
      const startDateTime = combineDateAndTime(data.startDate, data.startTime);
      const endDateTime = combineDateAndTime(data.endDate, data.endTime);
      return startDateTime && endDateTime && endDateTime >= startDateTime;
    },
    {
      message: "End date/time must be after start date/time.",
      path: ["endDate"], // Apply error to endDate field
    }
  );

type FormData = z.infer<typeof formSchema>;

// Helper function to combine date and time string into a Date object
const combineDateAndTime = (
  date: Date | undefined,
  timeString: string | undefined
): Date | null => {
  if (!date || !timeString) return null;
  const [hours, minutes] = timeString.split(":").map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

// Helper to extract HH:mm time from ISO string or Date
const formatTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), "HH:mm");
  } catch (e) {
    console.error("Error formatting time:", dateString, e);
    return "";
  }
};

// Helper to parse ISO string safely into Date
const parseDateSafe = (
  dateString: string | null | undefined
): Date | undefined => {
  if (!dateString) return undefined;
  try {
    return parseISO(dateString);
  } catch (e) {
    console.error("Error parsing date:", dateString, e);
    return undefined;
  }
};

interface EditEventFormProps {
  event: Event; // The event being edited
  onSuccess: () => void; // Callback to close dialog on success
}

export default function EditEventForm({
  event,
  onSuccess,
}: EditEventFormProps) {
  // Use the actual useUpdateEvent hook
  const updateEventMutation = useUpdateEvent();
  // Note: The hook's onSuccess/onError defined in useEvents.tsx will handle
  // query invalidation. We only need the component-level onSuccess for closing the dialog.

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    // Pre-fill form with existing event data
    defaultValues: {
      title: event.title || "",
      description: event.description || "",
      startDate: parseDateSafe(event.start_time),
      startTime: formatTime(event.start_time),
      endDate: parseDateSafe(event.end_time),
      endTime: formatTime(event.end_time),
      location: event.location || "",
      color: event.color || "", // Default color or empty
    },
  });

  // Reset form if the event prop changes
  useEffect(() => {
    form.reset({
      title: event.title || "",
      description: event.description || "",
      startDate: parseDateSafe(event.start_time),
      startTime: formatTime(event.start_time),
      endDate: parseDateSafe(event.end_time),
      endTime: formatTime(event.end_time),
      location: event.location || "",
      color: event.color || "",
    });
  }, [event, form]);

  function onSubmit(values: FormData) {
    console.log("Edit Form submitted:", values);

    const startDateTime = combineDateAndTime(
      values.startDate,
      values.startTime
    );
    const endDateTime = combineDateAndTime(values.endDate, values.endTime);

    if (!startDateTime || !endDateTime) {
      console.error("Invalid start or end date/time after validation.");
      // TODO: Show user feedback
      return;
    }

    // Map FormData to the UpdateEventPayload structure
    // Only include fields that were potentially changed
    const apiPayload: UpdateEventPayload = {
      title: values.title,
      description: values.description || undefined,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      location: values.location || undefined,
      color: values.color || undefined,
    };

    console.log("API Payload:", apiPayload);

    updateEventMutation.mutate(
      { eventId: event.id, payload: apiPayload }, // Use 'payload' key
      {
        onSuccess: () => {
          console.log("Event updated successfully!");
          onSuccess(); // Close the dialog
        },
        onError: (error) => {
          console.error("Failed to update event:", error);
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
                <Input placeholder="Event Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Date/Time Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
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
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* End Date/Time Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
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
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Conference Room A"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="color"
                  {...field}
                  className="h-10"
                  value={field.value ?? "#000000"}
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add details about the event..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updateEventMutation.isPending}
          className="w-full"
        >
          {updateEventMutation.isPending ? "Saving Changes..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
