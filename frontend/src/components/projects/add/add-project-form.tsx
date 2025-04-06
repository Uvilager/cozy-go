"use client";

import * as React from "react";
// Removed useQueryClient import as it's handled by the hook now
import { useCreateProject } from "@/hooks/useProjects"; // Import the mutation hook
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
// No longer need queryKeys or createProject API import here
import { toast } from "sonner"; // Import toast

interface AddProjectFormProps {
  onSuccess?: () => void; // Optional callback for successful creation
  onCancel?: () => void; // Optional callback for cancellation
}

export function AddProjectForm({ onSuccess, onCancel }: AddProjectFormProps) {
  // Use the mutation hook
  const createProjectMutation = useCreateProject();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Prevent submission if already loading
    if (createProjectMutation.isPending) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string; // Optional

    if (!name) {
      // Basic validation
      toast.error("Project name is required."); // Use toast for validation error
      // console.error("Project name is required.");
      return;
    }

    // Call the mutation
    createProjectMutation.mutate(
      { name, description },
      {
        onSuccess: (data) => {
          toast.success(`Project "${data.name}" created!`); // Show success toast
          // console.log(`Project "${data.name}" created!`);
          onSuccess?.(); // Call the onSuccess prop passed from the dialog
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to create project";
          toast.error(message); // Show error toast
          // console.error(message);
          // Don't close the dialog on error, let the user retry or cancel
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogDescription>
          Add a new project to organize your tasks.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name-create-dialog">Project Name</Label>
          <Input
            id="name-create-dialog"
            name="name" // Add name attribute for FormData
            placeholder="Enter project name"
            className="w-full"
            required
            // Disable input while mutation is pending
            disabled={createProjectMutation.isPending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description-create-dialog">Description</Label>
          <Textarea
            id="description-create-dialog"
            name="description" // Add name attribute for FormData
            placeholder="Enter project description (optional)"
            className="min-h-[80px]"
            // Disable input while mutation is pending
            disabled={createProjectMutation.isPending}
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
            disabled={createProjectMutation.isPending} // Disable while pending
          >
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={createProjectMutation.isPending}>
          {/* Show loading state */}
          {createProjectMutation.isPending ? "Creating..." : "Create Project"}
        </Button>
      </DialogFooter>
    </form>
  );
}
