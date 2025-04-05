"use client";

import React, { useState } from "react";
// Removed useMutation, useQueryClient imports
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddTaskForm, AddTaskFormValues } from "./add-task-form";
// Removed Task import (not directly needed)
// Removed createTask import (used by hook)
// Removed queryKeys import (used by hook)
import { useCreateTask } from "@/hooks/useTasks"; // Import the custom hook

interface AddTaskDialogProps {
  projectId: number | undefined; // Expect projectId as a prop
  trigger?: React.ReactNode; // Optional custom trigger
}

export function AddTaskDialog({ projectId, trigger }: AddTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Use the custom hook, passing the projectId and an onSuccess callback to close the dialog
  const { mutate: createTaskMutate, isPending: isSubmitting } = useCreateTask(
    projectId,
    {
      onSuccess: () => {
        setIsOpen(false); // Close dialog on successful creation
      },
      // onError is handled within the hook (shows toast)
    }
  );

  const handleFormSubmit = (values: AddTaskFormValues) => {
    console.log("Submitting task:", values);
    // The hook's mutationFn already checks for projectId, but we can keep the UI check too
    if (typeof projectId !== "number") {
      toast.error("Cannot add task: No project selected.");
      return;
    }
    // Call the mutate function from the hook
    createTaskMutate(values);
  };

  // Disable the trigger button if projectId is not valid
  const isTriggerDisabled = typeof projectId !== "number";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={isTriggerDisabled}>
        {trigger || <Button disabled={isTriggerDisabled}>Add Task</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Fill in the details for the new task. Click add when you're done.
          </DialogDescription>
        </DialogHeader>
        <AddTaskForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting} // Pass loading state from the hook
        />
        {/* Footer is usually handled by the form's submit button */}
        {/* <DialogFooter>
          <Button type="submit" form="add-task-form-id">Save changes</Button> // Link button to form if needed
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
