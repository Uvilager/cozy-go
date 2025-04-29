"use client";

import * as React from "react";
import { useDeleteCalendar } from "@/hooks/useCalendar"; // Changed hook import
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // Trigger is handled by parent
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/lib/api/calendars"; // Changed data type import
import { toast } from "sonner"; // For notifications

// Renamed interface and props
interface DeleteCalendarDialogProps {
  calendar: Calendar | null; // Calendar to delete, or null if none
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Optional callback after successful deletion
}

// Renamed component and props
export function DeleteCalendarDialog({
  calendar, // Changed prop name
  open,
  onOpenChange,
  onSuccess,
}: DeleteCalendarDialogProps) {
  const deleteCalendarMutation = useDeleteCalendar(); // Changed hook usage

  const handleDeleteConfirm = () => {
    if (!calendar || deleteCalendarMutation.isPending) return; // Check calendar

    deleteCalendarMutation.mutate(calendar.id, {
      // Use calendar.id
      onSuccess: () => {
        // Updated toast message
        toast.success(`Calendar "${calendar.name}" and its events deleted.`);
        onOpenChange(false); // Close dialog
        onSuccess?.(); // Call parent success handler
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "Failed to delete calendar"; // Updated error message
        toast.error(message);
        // Keep dialog open on error? Or close? Closing for now.
        onOpenChange(false);
      },
    });
  };

  // Don't render anything if no calendar is selected
  if (!calendar) {
    // Check calendar
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            calendar "<strong>{calendar.name}</strong>" and all of its
            associated events. {/* Updated description */}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCalendarMutation.isPending}>
            {" "}
            {/* Use calendar mutation state */}
            Cancel
          </AlertDialogCancel>
          {/* Use Button component for styling consistency if needed, or default action */}
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={deleteCalendarMutation.isPending}
            /* Use calendar mutation state */
            // Add visual indication of destructive action if desired
            // className="bg-red-600 hover:bg-red-700"
          >
            {deleteCalendarMutation.isPending
              ? "Deleting..."
              : "Delete Calendar"}{" "}
            {/* Updated button text */}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
