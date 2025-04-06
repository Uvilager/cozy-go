"use client";

import * as React from "react";
import { useDeleteProject } from "@/hooks/useProjects"; // Import the delete hook
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
import { Button } from "@/components/ui/button"; // Needed for AlertDialogAction styling
import { Project } from "@/lib/api"; // Import Project type
import { toast } from "sonner"; // For notifications

interface DeleteProjectDialogProps {
  project: Project | null; // Project to delete, or null if none
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Optional callback after successful deletion
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: DeleteProjectDialogProps) {
  const deleteProjectMutation = useDeleteProject();

  const handleDeleteConfirm = () => {
    if (!project || deleteProjectMutation.isPending) return;

    deleteProjectMutation.mutate(project.id, {
      onSuccess: () => {
        toast.success(`Project "${project.name}" and its tasks deleted.`);
        onOpenChange(false); // Close dialog
        onSuccess?.(); // Call parent success handler
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "Failed to delete project";
        toast.error(message);
        // Keep dialog open on error? Or close? Closing for now.
        onOpenChange(false);
      },
    });
  };

  // Don't render anything if no project is selected
  if (!project) {
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
            project "<strong>{project.name}</strong>" and all of its associated
            tasks.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProjectMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          {/* Use Button component for styling consistency if needed, or default action */}
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={deleteProjectMutation.isPending}
            // Add visual indication of destructive action if desired
            // className="bg-red-600 hover:bg-red-700"
          >
            {deleteProjectMutation.isPending ? "Deleting..." : "Delete Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
