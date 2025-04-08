"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
// Removed useMutation, useQueryClient imports
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomAlertDialog } from "../../alert-dialog";

import { labels } from "../data/data";
import { Task } from "../data/schema"; // Keep Task type
import { EditTaskDialog } from "../edit/edit-task-dialog";
import { useDeleteTask } from "@/hooks/useTasks"; // Import the custom hook

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  // Cast row.original to Task, assuming it matches the updated schema
  // Note: taskSchema.parse might fail if backend data doesn't perfectly match schema (e.g., nulls)
  // Using direct cast relies on the fetched data being correct.
  const task = row.original as Task;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Removed queryClient instantiation

  // Use the custom hook for deletion
  const { mutate: deleteTaskMutate, isPending: isDeleting } = useDeleteTask(
    task?.project_id, // Pass the projectId from the task
    {
      onSuccess: () => {
        setIsDeleteDialogOpen(false); // Close dialog on success
        // Toast notification is handled within the hook
      },
      onError: () => {
        // Toast notification is handled within the hook
        // Optionally keep dialog open on error? For now, let's close it.
        setIsDeleteDialogOpen(false);
      },
    }
  );

  const handleDelete = () => {
    if (!task || typeof task.id !== "number") {
      console.error("Invalid task or task ID for deletion.");
      // Optionally show a toast error here
      return;
    }
    console.log("Deleting task:", task.id);
    deleteTaskMutate(task.id); // Call mutate from the hook with taskId
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {/* Updated Edit Item */}
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {/* Fixed Label Type Issue */}
              <DropdownMenuRadioGroup value={task.label ?? undefined}>
                {labels.map((label) => (
                  <DropdownMenuRadioItem key={label.value} value={label.value}>
                    {label.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {/* Updated Delete Item */}
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-700 focus:bg-red-100"
          >
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Keep existing Delete Alert Dialog */}
      <CustomAlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Confirm Deletion"
        description={`Are you sure you want to delete task "TASK-${task.id}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        confirmText={isDeleting ? "Deleting..." : "Delete"} // Show loading state on button
        cancelText="Cancel"
        isConfirmDisabled={isDeleting} // Disable confirm button while deleting
      />

      {/* Add Edit Dialog */}
      <EditTaskDialog
        task={task}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
