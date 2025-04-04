"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Task } from "../data/schema"; // Adjusted import path

// Define the API endpoint URL
const API_URL =
  process.env.NEXT_PUBLIC_TASK_SERVICE_URL || "http://localhost:8081";

// Function to update an existing task
// Assumes API expects PUT /projects/{projectID}/tasks/{taskID}
async function updateTask(taskData: Task): Promise<Task> {
  // Expect full Task object including ID and ProjectID
  const { id, project_id, ...payload } = taskData; // Extract IDs

  // Remove empty optional fields if backend expects them to be absent
  if ("description" in payload && payload.description === "") {
    delete (payload as any).description;
  }
  if ("label" in payload && payload.label === "") {
    delete (payload as any).label;
  }
  // TODO: Handle dueDate formatting if included

  const response = await fetch(
    `${API_URL}/projects/${project_id}/tasks/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Send payload without IDs in body
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Update task error:", response.status, errorData);
    throw new Error(
      `Failed to update task: ${response.statusText} - ${errorData}`
    );
  }
  return response.json(); // Assuming API returns the updated task
}

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
  const queryClient = useQueryClient();

  // Map Task to EditTaskFormValues (handle potential type differences if any)
  // Ensure defaultValues are updated when the task prop changes
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

  const mutation = useMutation({
    mutationFn: updateTask,
    onSuccess: (data) => {
      toast.success(`Task "${data.title}" updated successfully!`);
      // Invalidate the tasks query to refetch data and update the table
      // Use the correct project ID from the task data
      queryClient.invalidateQueries({ queryKey: ["tasks", task.project_id] });
      onOpenChange(false); // Close the dialog on success
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const handleFormSubmit = (values: EditTaskFormValues) => {
    console.log("Updating task:", values);
    // Combine form values with necessary IDs before sending to mutation
    const taskToUpdate: Task = {
      ...task, // Include original ID, ProjectID, CreatedAt etc.
      ...values, // Override with updated form values
      // Ensure types match Task if EditTaskFormValues differs significantly
    };
    mutation.mutate(taskToUpdate);
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
        <EditTaskForm
          onSubmit={handleFormSubmit}
          isSubmitting={mutation.isPending}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}
