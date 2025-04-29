"use client";

import * as React from "react";
// No longer needs useState
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Removed DialogTrigger
import { AddProjectForm } from "./add-project-form"; // Import the form

interface AddProjectDialogProps {
  open: boolean; // Controlled state
  onOpenChange: (open: boolean) => void; // Callback to change state
  onSuccess?: () => void; // Optional callback after successful creation
  // Trigger is no longer needed as prop, it's handled by the parent
}

export function AddProjectDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddProjectDialogProps) {
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
      {/* Removed DialogTrigger */}
      <DialogContent>
        {/* Render the form inside the dialog content */}
        <AddProjectForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
