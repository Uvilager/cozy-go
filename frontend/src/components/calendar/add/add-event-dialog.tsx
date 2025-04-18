"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import the form component
import AddEventForm from "./add-event-form";

interface AddEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void; // For closing via overlay/esc
  onClose: () => void; // Explicit close function
  defaultDate?: Date; // Optional date to pre-fill
  projectId?: number | undefined; // Add projectId prop
}

export default function AddEventDialog({
  isOpen,
  onOpenChange,
  onClose,
  defaultDate,
  projectId, // Destructure projectId
}: AddEventDialogProps) {
  const handleSuccess = () => {
    onClose(); // Call the passed onClose function
  };

  return (
    // Use controlled dialog pattern
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Remove DialogTrigger */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Event/Task</DialogTitle>
          <DialogDescription>
            Fill in the details for your new calendar item.
          </DialogDescription>
        </DialogHeader>
        {/* Render the form component, passing defaultDate and projectId */}
        <AddEventForm
          onSuccess={handleSuccess}
          defaultDate={defaultDate}
          projectId={projectId}
        />
        {/* DialogFooter can be used if the form doesn't have its own submit button */}
        {/* <DialogFooter>
          <Button type="submit" form="add-event-form">Save changes</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
