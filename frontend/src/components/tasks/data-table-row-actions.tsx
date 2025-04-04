"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react"; // Keep useState

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
import { CustomAlertDialog } from "../alert-dialog"; // Keep existing alert dialog import

import { labels } from "./data/data";
import { taskSchema, Task } from "./data/schema"; // Import Task type
import { EditTaskDialog } from "./edit/edit-task-dialog"; // Import Edit Dialog

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // Renamed state variable
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for edit dialog
  const queryClient = useQueryClient();

  // Keep existing delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Ensure task.id is valid before fetching
      if (!task || typeof task.id !== "number") {
        throw new Error("Invalid task ID for deletion.");
      }
      await fetch(`http://localhost:8081/tasks/${task.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      setIsDeleteDialogOpen(false); // Close delete dialog on success
      // Use the correct project ID for invalidation if possible
      const projectId = task?.project_id ?? 1; // Default to 1 if project_id is missing
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => {
      // Handle delete error (e.g., show toast)
      console.error("Delete failed:", error);
      setIsDeleteDialogOpen(false); // Close dialog even on error? Or keep open?
    },
  });

  const handleDelete = () => {
    console.log("Deleting task:", task.id);
    deleteMutation.mutate();
    // Don't set dialog state here, onSuccess/onError handles it
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
        confirmText="Delete"
        cancelText="Cancel"
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
