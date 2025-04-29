"use client";

import * as React from "react";
import { useCreateCalendar } from "@/hooks/useCalendar"; // Import the calendar mutation hook
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"; // Import toast

interface AddCalendarFormProps {
  onSuccess?: () => void; // Optional callback for successful creation
  onCancel?: () => void; // Optional callback for cancellation
}

export function AddCalendarForm({ onSuccess, onCancel }: AddCalendarFormProps) {
  // Use the calendar mutation hook
  const createCalendarMutation = useCreateCalendar();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Prevent submission if already loading
    if (createCalendarMutation.isPending) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string; // Optional

    if (!name) {
      // Basic validation
      toast.error("Calendar name is required."); // Use toast for validation error
      return;
    }

    // Call the mutation
    createCalendarMutation.mutate(
      { name, description },
      {
        onSuccess: (data) => {
          toast.success(`Calendar "${data.name}" created!`); // Show success toast
          onSuccess?.(); // Call the onSuccess prop passed from the dialog
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to create calendar";
          toast.error(message); // Show error toast
          // Don't close the dialog on error, let the user retry or cancel
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Create New Calendar</DialogTitle>
        <DialogDescription>
          Add a new calendar to organize your events.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="calendar-name-create-dialog">Calendar Name</Label>
          <Input
            id="calendar-name-create-dialog"
            name="name" // Add name attribute for FormData
            placeholder="Enter calendar name"
            className="w-full"
            required
            // Disable input while mutation is pending
            disabled={createCalendarMutation.isPending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="calendar-description-create-dialog">
            Description
          </Label>
          <Textarea
            id="calendar-description-create-dialog"
            name="description" // Add name attribute for FormData
            placeholder="Enter calendar description (optional)"
            className="min-h-[80px]"
            // Disable input while mutation is pending
            disabled={createCalendarMutation.isPending}
          />
        </div>
      </div>
      <DialogFooter>
        {/* Use DialogClose for the cancel button */}
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createCalendarMutation.isPending} // Disable while pending
          >
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={createCalendarMutation.isPending}>
          {/* Show loading state */}
          {createCalendarMutation.isPending ? "Creating..." : "Create Calendar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
