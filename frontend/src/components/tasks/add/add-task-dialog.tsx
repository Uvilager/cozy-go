"use client";

import React, { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddTaskForm, AddTaskFormValues } from "./add-task-form"; // Adjusted import path
import { Task } from "../data/schema"; // Adjusted import path

// Define the API endpoint URL
const API_URL =
  process.env.NEXT_PUBLIC_TASK_SERVICE_URL || "http://localhost:8081";

// Function to post a new task
// TODO: Make projectId dynamic if needed
const projectId = 1;
async function createTask(newTaskData: AddTaskFormValues): Promise<Task> {
  // Assuming API returns the created task
  // Remove empty optional fields like description or label if backend expects them to be absent not just empty string
  const payload: any = { ...newTaskData };
  if (payload.description === "") {
    delete payload.description;
  }
  if (payload.label === "") {
    delete payload.label;
  }
  // TODO: Handle dueDate formatting if included

  const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Create task error:", response.status, errorData);
    throw new Error(
      `Failed to create task: ${response.statusText} - ${errorData}`
    );
  }
  return response.json();
}

interface AddTaskDialogProps {
  trigger?: React.ReactNode; // Optional custom trigger
}

export function AddTaskDialog({ trigger }: AddTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      toast.success(`Task "${data.title}" created successfully!`);
      // Invalidate the tasks query to refetch data and update the table
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setIsOpen(false); // Close the dialog on success
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  const handleFormSubmit = (values: AddTaskFormValues) => {
    console.log("Submitting task:", values);
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Task</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        {" "}
        {/* Adjust width if needed */}
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Fill in the details for the new task. Click add when you're done.
          </DialogDescription>
        </DialogHeader>
        <AddTaskForm
          onSubmit={handleFormSubmit}
          isSubmitting={mutation.isPending}
        />
        {/* Footer is usually handled by the form's submit button */}
        {/* <DialogFooter>
          <Button type="submit" form="add-task-form-id">Save changes</Button> // Link button to form if needed
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
