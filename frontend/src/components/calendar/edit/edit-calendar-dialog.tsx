"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EditProjectForm } from "./edit-project-form"; // Import the form
import { Project } from "@/lib/api"; // Import Project type

interface EditProjectDialogProps {
  project: Project | null; // Project to edit, or null if none
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Optional callback after successful update
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectDialogProps) {
  // Internal handlers to close dialog and call parent onSuccess
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Don't render anything if no project is selected or dialog is closed
  // The Dialog component itself handles the 'open' prop for visibility
  if (!project) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Render the form inside the dialog content, passing the project */}
        <EditProjectForm
          project={project}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
