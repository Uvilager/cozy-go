"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  EditEventTableForm,
  EditEventTableFormValues,
} from "./edit-event-table-form"; // Import the edit form
import { useUpdateEvent } from "@/hooks/useEvents"; // Import the event update hook
import { Event, UpdateEventPayload } from "@/lib/api/events"; // Import Event type and update payload type

interface EditEventTableDialogProps {
  eventToEdit: Event; // Expect the full event object
  trigger: React.ReactNode; // Expect a trigger component (e.g., button/icon)
}

// Helper to format ISO date string to datetime-local string
const formatDateTimeLocalInput = (isoString: string | undefined): string => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    // Check if the date is valid before formatting
    if (isNaN(date.getTime())) {
      console.error("Invalid date string received:", isoString);
      return ""; // Return empty string for invalid dates
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting date:", isoString, error);
    return ""; // Return empty string on error
  }
};

export function EditEventTableDialog({
  eventToEdit,
  trigger,
}: EditEventTableDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultValues, setDefaultValues] = useState<
    Partial<EditEventTableFormValues>
  >({});

  // Use the custom hook for event update
  const { mutate: updateEventMutate, isPending: isSubmitting } =
    useUpdateEvent();

  // Effect to set default values when the dialog opens or eventToEdit changes
  useEffect(() => {
    if (isOpen && eventToEdit) {
      setDefaultValues({
        title: eventToEdit.title,
        description: eventToEdit.description ?? "",
        start_time: formatDateTimeLocalInput(eventToEdit.start_time),
        end_time: formatDateTimeLocalInput(eventToEdit.end_time),
      });
    }
  }, [isOpen, eventToEdit]);

  const handleFormSubmit = (values: EditEventTableFormValues) => {
    console.log("Submitting updated event:", values);

    // Construct the payload for the API
    // Ensure eventId is included
    const payload: UpdateEventPayload = {
      title: values.title,
      description: values.description || undefined, // Use undefined if empty
      // Convert local datetime string back to ISO string for backend
      start_time: new Date(values.start_time).toISOString(),
      end_time: new Date(values.end_time).toISOString(),
    };

    // Call the mutate function from the hook
    updateEventMutate(
      { eventId: eventToEdit.id, payload }, // Pass eventId and payload
      {
        onSuccess: () => {
          setIsOpen(false); // Close dialog on success
          // Hook's internal onSuccess also runs
        },
        onError: () => {
          // Hook's internal onError also runs
          // Optionally keep dialog open on error
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* Trigger is now mandatory and passed as a prop */}
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to the event details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {/* Render form only when defaultValues are ready */}
        {defaultValues.start_time !== undefined && (
          <EditEventTableForm
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            defaultValues={defaultValues} // Pass the prepared default values
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
