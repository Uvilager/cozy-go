"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // If needed for separate buttons
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Import the form component
import AddEventForm from "./add-event-form";

interface AddEventDialogProps {
  children: React.ReactNode; // The trigger element (e.g., a Button)
  // Add props for default date/time later if needed
}

export default function AddEventDialog({ children }: AddEventDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    // Optionally trigger refetch here if mutation is handled outside the form
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Event/Task</DialogTitle>
          <DialogDescription>
            Fill in the details for your new calendar item.
          </DialogDescription>
        </DialogHeader>
        {/* Render the form component */}
        <AddEventForm onSuccess={handleSuccess} />
        {/* Remove placeholder */}
        {/* DialogFooter can be used if the form doesn't have its own submit button */}
        {/* <DialogFooter>
          <Button type="submit" form="add-event-form">Save changes</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
