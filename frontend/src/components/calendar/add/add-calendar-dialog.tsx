"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AddCalendarForm } from "./add-calendar-form"; // Corrected relative import path

// Renamed interface
interface AddCalendarDialogProps {
  open: boolean; // Controlled state
  onOpenChange: (open: boolean) => void; // Callback to change state
  onSuccess?: () => void; // Optional callback after successful creation
}

// Renamed component and props interface
export function AddCalendarDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCalendarDialogProps) {
  // Internal handlers now just call parent handlers or onOpenChange
  const handleSuccess = () => {
    onOpenChange(false); // Close the dialog on success
    onSuccess?.(); // Call the parent's success callback if provided
  };

  const handleCancel = () => {
    onOpenChange(false); // Close the dialog on cancel
  };

  // DialogTrigger is removed, Dialog is controlled by open/onOpenChange props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Render the calendar form */}
        <AddCalendarForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
