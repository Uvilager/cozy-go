"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose, // To close the dialog
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from "../tasks/data/schema"; // Import Task type
import { format } from "date-fns"; // For formatting dates/times
import { Badge } from "@/components/ui/badge"; // For displaying status/priority/label
import { useDeleteTask } from "@/hooks/useTasks"; // Import delete hook
// import { toast } from "sonner"; // No longer needed directly here
import { CustomAlertDialog } from "../alert-dialog"; // Import custom alert dialog
import EditEventDialog from "./edit/edit-event-dialog"; // Import the edit dialog

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  projectId?: number; // Pass projectId if needed for edit/delete actions
}

export default function TaskDetailDialog({
  task,
  isOpen,
  onClose,
  projectId,
}: TaskDetailDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false); // State for edit dialog

  // Call hooks unconditionally at the top level
  const deleteTaskMutation = useDeleteTask(projectId, {
    onSuccess: () => {
      onClose(); // Close the dialog on successful deletion
    },
    // onError is handled by the hook's toast
  });

  if (!task) {
    return null; // Don't render if no task is selected
  }

  // Helper to format date/time ranges nicely
  const formatDateTimeRange = (task: Task): string => {
    let dateStr = task.due_date
      ? format(new Date(task.due_date), "PPP")
      : "No due date";
    let timeStr = "";
    if (task.start_time) {
      timeStr = format(new Date(task.start_time), "p"); // e.g., 2:30 PM
      if (task.end_time) {
        timeStr += ` - ${format(new Date(task.end_time), "p")}`;
      }
    }
    return timeStr ? `${dateStr}, ${timeStr}` : dateStr;
  };

  const handleEdit = () => {
    console.log("Opening edit for task:", task?.id);
    setIsEditDialogOpen(true); // Open the edit dialog
    // Keep the detail dialog open underneath for now, or close it:
    // onClose();
  };

  // Function to actually perform the deletion, called by the alert dialog
  const confirmDelete = () => {
    if (!task) return;
    console.log("Confirming delete for task:", task.id);
    deleteTaskMutation.mutate(task.id);
    // onSuccess in the hook options will handle closing the main dialog
    setIsDeleteDialogOpen(false); // Close the alert dialog
  };

  // Function to open the delete confirmation dialog
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      {" "}
      {/* Use Fragment to render multiple top-level elements */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{task.title || "Task Details"}</DialogTitle>
            {/* Optional: Add description if needed */}
            {/* <DialogDescription>
            Details for the selected task/event.
          </DialogDescription> */}
          </DialogHeader>

          <div className="py-4 space-y-3">
            {/* Date & Time */}
            <div className="text-sm text-muted-foreground">
              {formatDateTimeRange(task)}
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            )}

            {/* Status, Priority, Label Badges */}
            <div className="flex flex-wrap gap-2">
              {task.status && (
                <Badge variant="outline">Status: {task.status}</Badge>
              )}
              {task.priority && (
                <Badge variant="secondary">Priority: {task.priority}</Badge>
              )}
              {task.label && (
                <Badge variant="destructive">Label: {task.label}</Badge>
              )}
              {/* Add Project badge if needed */}
              {/* {projectId && <Badge>Project: {projectId}</Badge>} */}
            </div>

            {/* Add other relevant details here */}
          </div>

          <DialogFooter className="sm:justify-between">
            {/* Left side button (e.g., Delete) */}
            <Button
              variant="outline"
              onClick={handleDeleteClick} // Use the function that opens the confirmation
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
            {/* Right side buttons */}
            <div className="flex space-x-2">
              <DialogClose asChild>
                <Button variant="ghost">Close</Button>
              </DialogClose>
              <Button onClick={handleEdit}>Edit</Button>{" "}
              {/* TODO: Implement Edit */}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <CustomAlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Are you absolutely sure?"
        description={`This action cannot be undone. This will permanently delete the task "${task?.title}".`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isConfirmDisabled={deleteTaskMutation.isPending} // Disable confirm while deleting
      />
      {/* Render Edit Dialog Conditionally */}
      <EditEventDialog
        task={task} // Pass the current task
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)} // Close only the edit dialog
        onSuccess={() => {
          setIsEditDialogOpen(false); // Close edit dialog on success
          onClose(); // Optionally close the detail dialog too after successful edit
        }}
      />
    </>
  );
}
