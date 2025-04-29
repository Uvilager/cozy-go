"use client";

import * as React from "react";
import { useUpdateCalendar } from "@/hooks/useCalendar"; // Import the calendar update hook
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
import { Calendar, UpdateCalendarPayload } from "@/lib/api"; // Import Calendar types
import { toast } from "sonner"; // For notifications

interface EditCalendarFormProps {
  calendar: Calendar; // Calendar data to pre-fill the form
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditCalendarForm({
  calendar,
  onSuccess,
  onCancel,
}: EditCalendarFormProps) {
  const updateCalendarMutation = useUpdateCalendar();

  // Use local state to manage form fields, initialized with calendar data
  const [name, setName] = React.useState(calendar.name);
  const [description, setDescription] = React.useState(
    calendar.description || ""
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (updateCalendarMutation.isPending) return;

    if (!name) {
      toast.error("Calendar name is required.");
      return;
    }

    const payload: UpdateCalendarPayload = {};
    // Only include fields if they have changed
    if (name !== calendar.name) {
      payload.name = name;
    }
    if (description !== (calendar.description || "")) {
      payload.description = description;
    }

    // If no fields changed, just close the dialog or show a message
    if (Object.keys(payload).length === 0) {
      toast.info("No changes detected.");
      onSuccess?.(); // Or just onCancel?.() if you prefer
      return;
    }

    updateCalendarMutation.mutate(
      { calendarId: calendar.id, payload }, // Use calendarId
      {
        onSuccess: (data) => {
          toast.success(`Calendar "${data.name}" updated!`);
          onSuccess?.();
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to update calendar";
          toast.error(message);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Calendar</DialogTitle>
        <DialogDescription>
          Update the details for "{calendar.name}".
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor={`calendar-name-edit-${calendar.id}`}>
            Calendar Name
          </Label>
          <Input
            id={`calendar-name-edit-${calendar.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter calendar name"
            className="w-full"
            required
            disabled={updateCalendarMutation.isPending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`calendar-description-edit-${calendar.id}`}>
            Description
          </Label>
          <Textarea
            id={`calendar-description-edit-${calendar.id}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter calendar description (optional)"
            className="min-h-[80px]"
            disabled={updateCalendarMutation.isPending}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateCalendarMutation.isPending}
          >
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={updateCalendarMutation.isPending}>
          {updateCalendarMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
