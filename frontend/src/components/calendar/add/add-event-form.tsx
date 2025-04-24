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
import { useCreateEvent } from "@/hooks/useEvents"; // Import the actual hook
import { CreateEventPayload } from "@/lib/api/events"; // Import payload type
import { Calendar as CalendarData } from "@/lib/api/calendars"; // Assuming a type for calendar data

// Define the form schema using Zod based on CreateEventPayload
const formSchema = z
  .object({
    // Add calendarId field - make it required
    calendarId: z
      .number({ required_error: "Calendar is required." })
      .int()
      .positive({ message: "Calendar is required." }),
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
// Returns Date object or null if timeString is invalid
const combineDateAndTime = (
  date: Date | undefined, // Allow date to be potentially undefined initially
  timeString: string | undefined
): Date | null => {
  if (!date || !timeString) return null; // Return null if date or time is missing
  const [hours, minutes] = timeString.split(":").map(Number);
  const newDate = new Date(date); // Create from valid date
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

interface AddEventFormProps {
  selectableCalendars: Pick<CalendarData, "id" | "name">[]; // Array of available calendars
  onSuccess: () => void; // Callback to close dialog on success
  defaultStartTime?: Date; // Optional date/time to pre-fill start
}

export default function AddEventForm({
  selectableCalendars,
  onSuccess,
  defaultStartTime,
}: AddEventFormProps) {
  // Use the actual useCreateEvent hook
  const createEventMutation = useCreateEvent();
  // Note: The hook's onSuccess/onError defined in useEvents.tsx will handle
  // query invalidation. We only need the component-level onSuccess for closing the dialog.

  // Calculate default end time (e.g., 1 hour after default start)
  const defaultEndTime = defaultStartTime
    ? new Date(defaultStartTime.getTime() + 60 * 60 * 1000)
    : undefined;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calendarId: selectableCalendars?.[0]?.id ?? undefined, // Default to first available calendar or undefined
      title: "",
      description: "",
      startDate: defaultStartTime ?? new Date(),
      startTime: defaultStartTime ? format(defaultStartTime, "HH:mm") : "09:00",
      endDate: defaultEndTime ?? new Date(),
      endTime: defaultEndTime ? format(defaultEndTime, "HH:mm") : "10:00",
      location: "",
      color: "", // Default color or empty
    },
  });

  function onSubmit(values: FormData) {
    console.log("Form submitted:", values);

    const startDateTime = combineDateAndTime(
      values.startDate,
      values.startTime
    );
    const endDateTime = combineDateAndTime(values.endDate, values.endTime);

    // Should not happen if Zod validation is correct, but good practice
    if (!startDateTime || !endDateTime) {
      console.error("Invalid start or end date/time after validation.");
      // TODO: Show user feedback (e.g., toast)
      return;
    }

    // Map FormData to the CreateEventPayload structure
    const apiPayload: CreateEventPayload = {
      calendar_id: values.calendarId, // Use the selected calendarId from form
      title: values.title,
      description: values.description || undefined, // Send undefined if empty
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      location: values.location || undefined,
      color: values.color || undefined,
    };

    console.log("API Payload:", apiPayload);

    // Call the mutation, passing component-level onSuccess for dialog closing
    createEventMutation.mutate(apiPayload, {
      onSuccess: () => {
        console.log("AddEventForm: Mutation succeeded, calling onSuccess.");
        onSuccess(); // Close dialog
      },
      // onError is handled globally in the hook, but could add specific UI feedback here
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Calendar Selector */}
        <FormField
          control={form.control}
          name="calendarId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calendar</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
                disabled={
                  !selectableCalendars || selectableCalendars.length === 0
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {selectableCalendars && selectableCalendars.length > 0 ? (
                    selectableCalendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id.toString()}>
                        {cal.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      No calendars available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
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

        {/* Start Date/Time */}
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

        {/* End Date/Time */}
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
                      // Optional: disable dates before start date?
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
                <Input placeholder="e.g., Conference Room A" {...field} />
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
                {/* Basic input for now, could be replaced with a color picker */}
                <Input type="color" {...field} className="h-10" />
                {/* <Input placeholder="e.g., #007bff" {...field} /> */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createEventMutation.isPending}
          className="w-full"
        >
          {createEventMutation.isPending ? "Adding Event..." : "Add Event"}
        </Button>
      </form>
    </Form>
  );
}
