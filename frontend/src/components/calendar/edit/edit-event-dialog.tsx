"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // Triggered programmatically, not by direct user click on a button here
} from "@/components/ui/dialog";
import { Event } from "@/lib/api/events"; // Import Event type
// Import the form component
import EditEventForm from "./edit-event-form";

interface EditEventDialogProps {
  event: Event | null; // The event to edit
  isOpen: boolean;
  onClose: () => void; // Function to call when the dialog should close
  onSuccess?: () => void; // Optional: Callback after successful update
}

export default function EditEventDialog({
  event, // Use event prop
  isOpen,
  onClose,
  onSuccess,
}: EditEventDialogProps) {
  if (!event) return null; // Don't render if no event

  const handleSuccess = () => {
    onClose(); // Close this dialog
    onSuccess?.(); // Call optional success callback
  };

  return (
    // Use controlled dialog pattern
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to your event below.
          </DialogDescription>
        </DialogHeader>
        {/* Render the form component here, passing the event and success handler */}
        <EditEventForm event={event} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
