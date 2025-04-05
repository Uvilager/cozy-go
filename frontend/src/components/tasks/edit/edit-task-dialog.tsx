"use client";

import React, { useState, useEffect } from "react";
// Removed useMutation, useQueryClient imports
import { toast } from "sonner";

// Removed Button import (not used directly)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // Trigger will be handled manually in row actions
} from "@/components/ui/dialog";
import { EditTaskForm, EditTaskFormValues } from "./edit-task-form";
import { Task } from "../data/schema";
// Removed local updateTask function and API_URL
import { useUpdateTask } from "@/hooks/useTasks"; // Import the custom hook
// Removed queryKeys import (handled by hook)

interface EditTaskDialogProps {
  task: Task; // The task data to edit
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({
  task,
  isOpen,
  onOpenChange,
}: EditTaskDialogProps) {
  // Removed queryClient instantiation

  // Map Task to EditTaskFormValues
  const [defaultValues, setDefaultValues] = useState<
    Partial<EditTaskFormValues>
  >({});

  useEffect(() => {
    if (task) {
      setDefaultValues({
        title: task.title,
        description: task.description ?? "", // Handle potential null from backend if applicable
        status: task.status,
        label: task.label ?? "", // Handle potential null
        priority: task.priority,
        // dueDate: task.dueDate ? new Date(task.dueDate) : undefined, // Convert string date if needed
      });
    }
  }, [task]);

  // Use the custom hook for updating
  const { mutate: updateTaskMutate, isPending: isSubmitting } = useUpdateTask(
    task?.project_id, // Pass projectId for invalidation
    {
      onSuccess: (updatedTask) => {
        // Toast is handled by hook
        onOpenChange(false); // Close dialog on success
      },
      // onError is handled by hook
    }
  );

  const handleFormSubmit = (values: EditTaskFormValues) => {
    if (!task || typeof task.id !== "number") {
      toast.error("Cannot update task: Invalid task data.");
      return;
    }
    console.log("Updating task:", task.id, values);
    // Call the mutate function from the hook, passing taskId and the form values
    updateTaskMutate({ taskId: task.id, taskData: values });
  };

  // Don't render the dialog if there's no task data (e.g., initial state)
  if (!task) {
    return null;
  }

  return (
    // Control open state externally via props
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* No DialogTrigger here, opened programmatically */}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Task (ID: {task.id})</DialogTitle>
          <DialogDescription>
            Make changes to the task details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {/* Pass defaultValues derived from the task prop */}
        {/* Pass defaultValues derived from the task prop */}
        <EditTaskForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting} // Pass loading state from hook
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}
