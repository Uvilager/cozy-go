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
import { Calendar as CalendarData } from "@/lib/api/calendars"; // Assuming a type for calendar data

interface AddEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void; // For closing via overlay/esc
  onClose: () => void; // Explicit close function
  selectableCalendars: Pick<CalendarData, "id" | "name">[]; // Pass the list of calendars
  defaultStartTime?: Date; // Optional start time to pre-fill
}

export default function AddEventDialog({
  isOpen,
  onOpenChange,
  onClose,
  selectableCalendars, // Use selectableCalendars
  defaultStartTime,
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
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Fill in the details for your new event.
          </DialogDescription>
        </DialogHeader>
        {/* Render the form component, passing required props */}
        <AddEventForm
          onSuccess={handleSuccess}
          selectableCalendars={selectableCalendars} // Pass selectableCalendars
          defaultStartTime={defaultStartTime}
        />
        {/* DialogFooter can be used if the form doesn't have its own submit button */}
        {/* <DialogFooter>
          <Button type="submit" form="add-event-form">Save changes</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
