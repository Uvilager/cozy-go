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
import { Task } from "@/components/tasks/data/schema";
// Import the form component
import EditEventForm from "./edit-event-form";

interface EditEventDialogProps {
  task: Task | null; // The task to edit
  isOpen: boolean;
  onClose: () => void; // Function to call when the dialog should close
  onSuccess?: () => void; // Optional: Callback after successful update
}

export default function EditEventDialog({
  task,
  isOpen,
  onClose,
  onSuccess,
}: EditEventDialogProps) {
  if (!task) return null; // Don't render if no task

  const handleSuccess = () => {
    onClose(); // Close this dialog
    onSuccess?.(); // Call optional success callback
  };

  return (
    // Use controlled dialog pattern
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task/Event</DialogTitle>
          <DialogDescription>
            Make changes to your calendar item below.
          </DialogDescription>
        </DialogHeader>
        {/* Render the form component here, passing the task and success handler */}
        <EditEventForm task={task} onSuccess={handleSuccess} />
        {/* Remove placeholder */}
      </DialogContent>
    </Dialog>
  );
}
