"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EditCalendarForm } from "./edit-calendar-form"; // Corrected relative import path
import { Calendar } from "@/lib/api/calendars"; // Changed data type import

// Renamed interface and props
interface EditCalendarDialogProps {
  calendar: Calendar | null; // Calendar to edit, or null if none
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Optional callback after successful update
}

// Renamed component and props
export function EditCalendarDialog({
  calendar, // Changed prop name
  open,
  onOpenChange,
  onSuccess,
}: EditCalendarDialogProps) {
  // Internal handlers to close dialog and call parent onSuccess
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Don't render anything if no calendar is selected or dialog is closed
  // The Dialog component itself handles the 'open' prop for visibility
  if (!calendar) {
    // Check calendar prop
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Render the calendar form inside the dialog content, passing the calendar */}
        <EditCalendarForm // Use EditCalendarForm
          calendar={calendar} // Pass calendar prop
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
