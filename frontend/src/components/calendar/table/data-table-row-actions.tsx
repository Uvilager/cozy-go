"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuRadioGroup, // Removed label-specific imports
  // DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  // DropdownMenuSub, // Removed label-specific imports
  // DropdownMenuSubContent,
  // DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomAlertDialog } from "../../alert-dialog"; // Keep alert dialog

import { Event } from "@/lib/api/events"; // Import Event type
import { useDeleteEvent } from "@/hooks/useEvents"; // Import the event delete hook
import { EditEventTableDialog } from "./edit/edit-event-table-dialog"; // Import the actual edit dialog

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  // Cast row.original to Event
  const event = row.original as Event;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // Removed isEditDialogOpen state

  // Use the custom hook for event deletion (no arguments needed here)
  const { mutate: deleteEventMutate, isPending: isDeleting } = useDeleteEvent();

  const handleDelete = () => {
    if (
      !event ||
      typeof event.id !== "number" ||
      typeof event.calendar_id !== "number" // Ensure calendar_id is present
    ) {
      console.error("Invalid event, event ID, or calendar ID for deletion.");
      // Optionally show a toast error here
      return;
    }
    console.log(
      "Deleting event:",
      event.id,
      "from calendar:",
      event.calendar_id
    );
    // Call mutate with eventId/calendarId and add component-specific callbacks
    deleteEventMutate(
      { eventId: event.id, calendarId: event.calendar_id },
      {
        onSuccess: () => {
          setIsDeleteDialogOpen(false); // Close dialog on success
          // Hook's internal onSuccess (logging, invalidation) also runs
        },
        onError: () => {
          setIsDeleteDialogOpen(false); // Close dialog on error
          // Hook's internal onError (logging) also runs
        },
      }
    );
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
          {/* Edit Item - Wrapped with EditEventTableDialog */}
          <EditEventTableDialog
            eventToEdit={event}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Edit
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Removed Labels Sub-menu */}
          {/* Delete Item */}
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-700 focus:bg-red-100"
            disabled={isDeleting} // Disable while deleting
          >
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Alert Dialog */}
      <CustomAlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Confirm Deletion"
        description={`Are you sure you want to delete event "EVENT-${event?.id}"? This action cannot be undone.`} // Updated text
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        isConfirmDisabled={isDeleting}
      />

      {/* EditEventTableDialog is now triggered directly from the DropdownMenuItem */}
    </>
  );
}
