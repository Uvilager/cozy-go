"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
// Import useMutation if/when create project functionality is added
// import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button"; // Corrected path
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"; // Corrected path
// Dialog related imports are no longer needed here
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Corrected path
// Input, Label, Textarea are no longer needed here
import {
  Check,
  ChevronsUpDown,
  CalendarDays, // Changed icon
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Corrected path
import { useCalendars } from "@/hooks/useCalendar"; // Changed hook
import { Calendar } from "@/lib/api/calendars"; // Changed data type import
// Import calendar API functions when needed
// import { createCalendar } from "@/lib/api";
import { AddCalendarDialog } from "./add/add-calendar-dialog"; // Corrected relative path
import { EditCalendarDialog } from "./edit/edit-calendar-dialog"; // Corrected relative path
import { DeleteCalendarDialog } from "./delete/delete-calendar-dialog"; // Corrected relative path
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components

// Renamed interface and props
interface CalendarPickerProps {
  currentCalendarId: string | undefined; // Calendar ID from URL params (or parent state)
  onCalendarChange: (calendarId: string | undefined) => void; // Callback when calendar changes
}

// Renamed component and props
export function CalendarPicker({
  currentCalendarId,
  onCalendarChange,
}: CalendarPickerProps) {
  // Destructure the new prop
  // const router = useRouter(); // No longer needed for URL update here
  // const searchParams = useSearchParams(); // No longer needed for URL update here

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  // Renamed state variables to use Calendar type
  const [selectedCalendar, setSelectedCalendar] = useState<Calendar | null>(
    null
  );
  // State for edit/delete dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCalendar, setDeletingCalendar] = useState<Calendar | null>(
    null
  );

  // Fetch calendars using the hook
  const {
    data: calendarsData,
    isLoading: isLoadingCalendars,
    isError,
    error,
  } = useCalendars(); // Updated hook call and variables
  const calendars = useMemo(() => calendarsData ?? [], [calendarsData]); // Updated variable name

  // --- TODO: Implement Project Creation Mutation ---
  // --- TODO: Implement Calendar Creation Mutation ---
  // ... (mutation logic needs adaptation for calendars) ...

  // Determine the selected calendar based on currentCalendarId prop
  useEffect(() => {
    if (calendars.length > 0) {
      // Use calendars
      const calendarFromProp = currentCalendarId // Use currentCalendarId
        ? calendars.find((c) => c.id.toString() === currentCalendarId) // Find in calendars
        : undefined;
      // If prop ID is invalid or missing, default to first calendar
      setSelectedCalendar(calendarFromProp || calendars[0]); // Use setSelectedCalendar
      // If the prop was undefined/invalid and we defaulted, call onCalendarChange
      if (!calendarFromProp && calendars.length > 0) {
        console.log(
          "CalendarPicker: No valid initial calendar ID, defaulting to first calendar and notifying parent." // Updated log
        );
        onCalendarChange(calendars[0].id.toString()); // Use onCalendarChange
      }
    } else {
      setSelectedCalendar(null); // Use setSelectedCalendar
      // If there are no calendars, notify parent
      if (currentCalendarId !== undefined) {
        // Use currentCalendarId
        onCalendarChange(undefined); // Use onCalendarChange
      }
    }
    // Depend on currentCalendarId prop and the fetched calendars list
  }, [currentCalendarId, calendars, onCalendarChange]); // Updated dependencies

  // Call the parent's handler when a calendar is selected
  const handleCalendarSelect = (calendarId: string) => {
    // Renamed function and parameter
    const calendar = calendars.find((c) => c.id.toString() === calendarId); // Find in calendars
    if (calendar) {
      // Call the callback function passed from the parent
      onCalendarChange(calendarId); // Use onCalendarChange
      setPopoverOpen(false); // Close the popover
    }
  };

  // Loading and Error States
  if (isLoadingCalendars) {
    // Use isLoadingCalendars
    return (
      <Button variant="outline" disabled className="w-[220px] justify-start">
        Loading calendars... {/* Updated text */}
      </Button>
    );
  }

  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load calendars"; // Updated text
    return (
      <Button
        variant="destructive"
        disabled
        className="w-[220px] justify-start"
      >
        Error: {errorMessage}
      </Button>
    );
  }

  // Use calendars variable here
  if (!calendars || calendars.length === 0) {
    // Render Button to trigger dialog and the controlled Dialog component
    return (
      <>
        <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Calendar {/* Updated text */}
        </Button>
        {/* Use AddCalendarDialog */}
        <AddCalendarDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          // Optional: Add onSuccess handler if needed
        />
      </>
    );
  }

  // Main component render when projects exist
  return (
    // Wrap Popover and Dialog in a Fragment
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            aria-label="Select a calendar" // Updated aria-label
            className="w-[220px] justify-between"
          >
            {selectedCalendar ? ( // Use selectedCalendar
              <div className="flex items-center gap-2 truncate">
                <CalendarDays className="h-4 w-4 shrink-0 opacity-50" />{" "}
                {/* Changed icon */}
                <span className="truncate">{selectedCalendar.name}</span>{" "}
                {/* Use selectedCalendar */}
              </div>
            ) : (
              "Select calendar..." // Updated text
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0">
          <Command>
            <CommandInput placeholder="Search calendars..." />{" "}
            {/* Updated placeholder */}
            <CommandList>
              <CommandEmpty>No calendars found.</CommandEmpty>{" "}
              {/* Updated text */}
              <CommandGroup>
                {calendars.map(
                  (
                    calendar // Use calendars and calendar
                  ) => (
                    // Wrap CommandItem content in a div for flex layout
                    <div
                      key={calendar.id} // Use calendar.id
                      className="flex items-center justify-between w-full"
                    >
                      <CommandItem
                        value={calendar.id.toString()} // Use calendar.id
                        onSelect={
                          () => handleCalendarSelect(calendar.id.toString()) // Use handleCalendarSelect
                        }
                        className="flex-grow cursor-pointer" // Make item take space and be clickable
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCalendar?.id === calendar.id // Use selectedCalendar
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="truncate">{calendar.name}</span>{" "}
                        {/* Use calendar.name */}
                      </CommandItem>
                      {/* Dropdown Menu for Edit/Delete */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 px-1 h-auto" // Adjust padding/height
                            onClick={(e) => e.stopPropagation()} // Prevent item selection
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => e.stopPropagation()} // Prevent closing popover
                        >
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditingCalendar(calendar); // Use setEditingCalendar
                              setEditDialogOpen(true);
                              setPopoverOpen(false); // Close popover
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setDeletingCalendar(calendar); // Use setDeletingCalendar
                              setDeleteDialogOpen(true);
                              setPopoverOpen(false); // Close popover
                            }}
                            className="text-red-600" // Destructive action style
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                )}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                {/* CommandItem now just sets the state to open the dialog */}
                <CommandItem
                  onSelect={() => {
                    setPopoverOpen(false); // Close popover first
                    setCreateDialogOpen(true); // Then open dialog
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Calendar {/* Updated text */}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Render the controlled AddCalendarDialog */}
      <AddCalendarDialog // Use AddCalendarDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        // Optional: Add onSuccess handler if needed
        // onSuccess={() => console.log("Calendar created successfully!")}
      />

      {/* Render Edit Dialog */}
      <EditCalendarDialog // Use EditCalendarDialog
        calendar={editingCalendar} // Pass editingCalendar
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditingCalendar(null); // Use setEditingCalendar
          // Optionally refetch or rely on cache invalidation from hook
        }}
      />

      {/* Render Delete Dialog */}
      <DeleteCalendarDialog // Use DeleteCalendarDialog
        calendar={deletingCalendar} // Pass deletingCalendar
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={() => {
          setDeletingCalendar(null); // Use setDeletingCalendar
          // If the deleted calendar was the selected one, clear selection or select first
          if (selectedCalendar?.id === deletingCalendar?.id) {
            // Use selectedCalendar and deletingCalendar
            const remainingCalendars = calendars.filter(
              // Use calendars
              (c) => c.id !== deletingCalendar?.id // Use deletingCalendar
            );
            if (remainingCalendars.length > 0) {
              handleCalendarSelect(remainingCalendars[0].id.toString()); // Use handleCalendarSelect
            } else {
              // Handle case where no calendars are left
              setSelectedCalendar(null); // Use setSelectedCalendar
              onCalendarChange(undefined); // Use onCalendarChange
            }
          }
        }}
      />
    </>
  );
}
