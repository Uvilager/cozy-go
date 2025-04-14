"use client";

import React, { useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  addWeeks,
  subWeeks,
  startOfWeek,
  addDays,
  subDays,
} from "date-fns";
import CalendarHeader, { CalendarView } from "@/components/calendar/header";
// Placeholders for view components - we will create these next
import MonthView from "@/components/calendar/month-view";
import WeekView from "@/components/calendar/week-view";
import DayView from "@/components/calendar/day-view";
import AddEventDialog from "@/components/calendar/add/add-event-dialog"; // Import Add dialog

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<
    Date | undefined
  >(undefined);
  // currentDate represents the reference point for the current view
  // For month view: the first day of the displayed month
  // For week view: the first day (e.g., Sunday/Monday) of the displayed week
  // For day view: the displayed day
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
    // Reset currentDate based on the new view, anchored to the old date
    if (newView === "month") {
      setCurrentDate(startOfMonth(currentDate));
    } else if (newView === "week") {
      setCurrentDate(startOfWeek(currentDate, { weekStartsOn: 1 })); // Assuming week starts on Monday
    }
    // No change needed for day view, it uses the exact date
  };

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (view === "week") {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else if (view === "day") {
      setCurrentDate((prev) => subDays(prev, 1));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (view === "week") {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else if (view === "day") {
      setCurrentDate((prev) => addDays(prev, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    if (view === "month") {
      setCurrentDate(startOfMonth(today));
    } else if (view === "week") {
      setCurrentDate(startOfWeek(today, { weekStartsOn: 1 }));
    } else {
      setCurrentDate(today);
    }
  };

  // --- Handlers for Add Event Dialog ---
  const handleOpenAddDialog = (date?: Date) => {
    setSelectedDateForNewEvent(date); // Set the date if provided (from day click)
    setIsAddEventDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setIsAddEventDialogOpen(false);
    setSelectedDateForNewEvent(undefined); // Clear selected date on close
  };

  const renderView = () => {
    switch (view) {
      case "month":
        // Pass the handler for day clicks down to MonthView
        return (
          <MonthView
            currentDate={currentDate}
            onDayClick={handleOpenAddDialog}
          />
        );
      case "week":
        // Pass the handler for time slot clicks down to WeekView
        return (
          <WeekView
            currentDate={currentDate}
            onTimeSlotClick={handleOpenAddDialog}
          />
        );
      case "day":
        return <DayView currentDate={currentDate} />;
      // return <div className="p-4">Day View Placeholder</div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={handleViewChange}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onAddEventClick={() => handleOpenAddDialog()} // Pass handler for header button
      />
      {/* This div should allow the view component to fill remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {" "}
        {/* Use overflow-hidden here */}
        {/* Render the current view component - IT needs to handle its own internal scrolling */}
        {renderView()}
      </div>

      {/* Render Add Event Dialog (controlled by state) */}
      <AddEventDialog
        isOpen={isAddEventDialogOpen}
        onOpenChange={setIsAddEventDialogOpen} // Allows closing via overlay click/esc
        onClose={handleCloseAddDialog} // Explicit close handler
        defaultDate={selectedDateForNewEvent} // Pass selected date
      />
    </div>
  );
}
