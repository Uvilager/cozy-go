"use client";

import * as React from "react";
import { useUpdateProject } from "@/hooks/useProjects"; // Import the update hook
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
import { Project, UpdateProjectPayload } from "@/lib/api"; // Import types
import { toast } from "sonner"; // For notifications

interface EditProjectFormProps {
  project: Project; // Project data to pre-fill the form
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditProjectForm({
  project,
  onSuccess,
  onCancel,
}: EditProjectFormProps) {
  const updateProjectMutation = useUpdateProject();

  // Use local state to manage form fields, initialized with project data
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(
    project.description || ""
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (updateProjectMutation.isPending) return;

    if (!name) {
      toast.error("Project name is required.");
      return;
    }

    const payload: UpdateProjectPayload = {};
    // Only include fields if they have changed
    if (name !== project.name) {
      payload.name = name;
    }
    if (description !== (project.description || "")) {
      payload.description = description;
    }

    // If no fields changed, just close the dialog or show a message
    if (Object.keys(payload).length === 0) {
      toast.info("No changes detected.");
      onSuccess?.(); // Or just onCancel?.() if you prefer
      return;
    }

    updateProjectMutation.mutate(
      { projectId: project.id, payload },
      {
        onSuccess: (data) => {
          toast.success(`Project "${data.name}" updated!`);
          onSuccess?.();
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to update project";
          toast.error(message);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogDescription>
          Update the details for &quot;{project.name}&quot;.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor={`name-edit-${project.id}`}>Project Name</Label>
          <Input
            id={`name-edit-${project.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            className="w-full"
            required
            disabled={updateProjectMutation.isPending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`description-edit-${project.id}`}>Description</Label>
          <Textarea
            id={`description-edit-${project.id}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter project description (optional)"
            className="min-h-[80px]"
            disabled={updateProjectMutation.isPending}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateProjectMutation.isPending}
          >
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={updateProjectMutation.isPending}>
          {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
