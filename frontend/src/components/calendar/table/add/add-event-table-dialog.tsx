"use client";

import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AddEventTableForm,
  AddEventTableFormValues,
} from "./add-event-table-form"; // Import the new form
import { useCreateEvent } from "@/hooks/useEvents"; // Import the event creation hook
import { CreateEventPayload } from "@/lib/api/events"; // Import payload type

interface AddEventTableDialogProps {
  calendarId: number | undefined; // Expect calendarId as a prop
  trigger?: React.ReactNode; // Optional custom trigger
}

export function AddEventTableDialog({
  calendarId,
  trigger,
}: AddEventTableDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Use the custom hook for event creation (no arguments needed here)
  const { mutate: createEventMutate, isPending: isSubmitting } =
    useCreateEvent();

  const handleFormSubmit = (values: AddEventTableFormValues) => {
    console.log("Submitting event:", values);
    if (typeof calendarId !== "number") {
      toast.error("Cannot add event: No calendar selected.");
      setIsOpen(false); // Close dialog if no calendar ID
      return;
    }

    // Construct the payload for the API
    const payload: CreateEventPayload = {
      calendar_id: calendarId,
      title: values.title,
      description: values.description || undefined, // Use undefined for optional field
      // Convert local datetime string to ISO string for backend
      start_time: new Date(values.start_time).toISOString(),
      end_time: new Date(values.end_time).toISOString(),
    };

    // Call the mutate function from the hook, passing component-specific callbacks
    createEventMutate(payload, {
      onSuccess: () => {
        setIsOpen(false); // Close dialog on success
        // Hook's internal onSuccess also runs
      },
      onError: () => {
        // Hook's internal onError also runs
        // Optionally keep dialog open on error
      },
    });
  };

  // Disable the trigger button if calendarId is not valid
  const isTriggerDisabled = typeof calendarId !== "number";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={isTriggerDisabled}>
        {trigger || (
          <Button size="sm" className="h-8" disabled={isTriggerDisabled}>
            Add Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Fill in the details for the new event. Click add when you're done.
          </DialogDescription>
        </DialogHeader>
        <AddEventTableForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting} // Pass loading state from the hook
        />
      </DialogContent>
    </Dialog>
  );
}
