import React, { useState } from "react"; // Import useState
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Assuming shadcn dialog
import { Button } from "@/components/ui/button";
import { Event } from "@/lib/api/events"; // Import Event type
import { format } from "date-fns";
import EditEventDialog from "./edit/edit-event-dialog"; // Import the edit dialog
import { useDeleteEvent } from "@/hooks/useEvents"; // Import the delete hook

interface EventDetailDialogProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Optional: Callback after successful update (passed down)
}

export default function EventDetailDialog({
  event,
  isOpen,
  onClose,
  onSuccess, // Receive onSuccess prop
}: EventDetailDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const deleteEventMutation = useDeleteEvent(); // Initialize delete hook

  if (!event) {
    return null; // Don't render if no event is selected
  }

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
  };

  // Function to handle success from the edit form
  const handleEditSuccess = () => {
    setIsEditDialogOpen(false); // Close edit dialog
    onSuccess?.(); // Call the original success callback (e.g., to refetch events)
    // Optionally, you might want to close the detail dialog too, or keep it open
    // onClose(); // Uncomment if you want to close the detail view after edit
  };

  const handleDeleteClick = () => {
    if (!event) return;
    // Simple confirmation
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      deleteEventMutation.mutate(
        { eventId: event.id, calendarId: event.calendar_id },
        {
          onSuccess: () => {
            console.log("Event deleted successfully!");
            onClose(); // Close the detail dialog after delete
            onSuccess?.(); // Call the main success handler (e.g., refetch)
          },
          onError: (error) => {
            console.error("Failed to delete event:", error);
            // TODO: Show user-friendly error message (e.g., toast)
          },
        }
      );
    }
  };

  return (
    <>
      <Dialog open={isOpen && !isEditDialogOpen} onOpenChange={onClose}>
        {" "}
        {/* Only open if edit dialog isn't */}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{event.title}</DialogTitle>
            <DialogDescription>
              Details for the selected event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Display Event Details */}
            {event.description && (
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">
                  {event.description}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Starts</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.start_time), "PPP p")}{" "}
                {/* Format date and time */}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Ends</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.end_time), "PPP p")}{" "}
                {/* Format date and time */}
              </p>
            </div>
            {event.location && (
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
              </div>
            )}
            {event.color && (
              <div>
                <p className="text-sm font-medium">Color</p>
                <div className="flex items-center">
                  <span
                    className="h-4 w-4 rounded-full mr-2"
                    style={{ backgroundColor: event.color }}
                  ></span>
                  <p className="text-sm text-muted-foreground">{event.color}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Calendar ID</p>
              <p className="text-sm text-muted-foreground">
                {event.calendar_id}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button variant="outline" onClick={handleEditClick}>
              {" "}
              {/* Edit Button */}
              Edit
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render the Edit Dialog conditionally */}
      <EditEventDialog
        event={event}
        isOpen={isEditDialogOpen}
        onClose={handleEditDialogClose}
        onSuccess={handleEditSuccess} // Pass down the success handler
      />
    </>
  );
}
