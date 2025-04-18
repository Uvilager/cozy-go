"use client";

import React, { useState } from "react";
import {
  startOfMonth,
  startOfWeek,
  subMonths,
  addMonths,
  subWeeks,
  addWeeks,
  subDays,
  addDays,
  // addDays, // Removed duplicate
} from "date-fns";
import { useSearchParams } from "next/navigation"; // Import useSearchParams
// import Sidebar from "./sidebar"; // Remove old sidebar import
import { useCalendarStore } from "@/store/calendarStore"; // Import Zustand store
import CalendarHeader, { CalendarView } from "./header";
import MonthView from "./month-view";
import WeekView from "./week-view";
import DayView from "./day-view";
import AddEventDialog from "./add/add-event-dialog";

interface CalendarClientUIProps {
  // Initial props passed from the server component (page.tsx)
  initialDate?: Date; // Keep initialDate if needed for first load before store hydrates
  initialView?: CalendarView;
  // Remove initialProjectId
  // initialProjectId?: number;
}

// Helper to parse project IDs from URL param (copied from MultiProjectSelector)
const parseProjectIds = (param: string | null): number[] => {
  if (!param) return [];
  return param.split(",").map(Number).filter(Boolean); // Filter out NaN/0 if parsing fails
};

export default function CalendarClientUI({
  initialDate, // Can be removed if store hydration is reliable enough
  initialView,
}: // initialProjectId, // Removed
CalendarClientUIProps) {
  // --- State Management ---
  const [view, setView] = useState<CalendarView>(initialView || "month");
  // Get date state from Zustand store
  const { currentDate, setCurrentDate } = useCalendarStore();
  // Get project IDs from URL search params
  const searchParams = useSearchParams();
  const selectedProjectIdsArray = parseProjectIds(searchParams.get("projects"));

  // State for the Add Event Dialog
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<
    Date | undefined
  >(undefined);

  // --- Handlers ---
  const handleSetView = (newView: CalendarView) => {
    setView(newView);
    let newReferenceDate = currentDate;
    // Use currentDate from store for reference, but don't reset it here
    // Resetting based on view change might be confusing if user navigated via mini-cal
    // Let's rely on handleNavigateDate for explicit date changes
    // let newReferenceDate = currentDate;
    // if (newView === "month") {
    //   newReferenceDate = startOfMonth(currentDate);
    // } else if (newView === "week") {
    //   newReferenceDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    // }
    // if (newReferenceDate.getTime() !== currentDate.getTime()) {
    //   setCurrentDate(newReferenceDate); // Use store action
    // }
  };

  const handleNavigateDate = (date: Date) => {
    let newReferenceDate: Date;
    if (view === "month") {
      newReferenceDate = startOfMonth(date);
    } else if (view === "week") {
      newReferenceDate = startOfWeek(date, { weekStartsOn: 1 });
    } else {
      // Day view
      newReferenceDate = date;
    }
    setCurrentDate(newReferenceDate); // Use store action
  };

  const handlePrevious = () => {
    let newDate: Date;
    if (view === "month") {
      newDate = subMonths(currentDate, 1);
    } else if (view === "week") {
      newDate = subWeeks(currentDate, 1);
    } else {
      newDate = subDays(currentDate, 1);
    }
    setCurrentDate(newDate); // Use store action
  };

  const handleNext = () => {
    let newDate: Date;
    if (view === "month") {
      newDate = addMonths(currentDate, 1);
    } else if (view === "week") {
      newDate = addWeeks(currentDate, 1);
    } else {
      newDate = addDays(currentDate, 1);
    }
    setCurrentDate(newDate); // Use store action
  };

  const handleToday = () => {
    handleNavigateDate(new Date());
  };

  // Remove handleSetProject as project state is now driven by URL via MultiProjectSelector
  // const handleSetProject = (id: number | undefined) => { ... };

  // --- Add Event Dialog Handlers ---
  const handleOpenAddDialog = (date?: Date) => {
    setSelectedDateForNewEvent(date);
    setIsAddEventDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setIsAddEventDialogOpen(false);
    setSelectedDateForNewEvent(undefined);
  };

  // --- Render View Logic ---
  const renderView = () => {
    switch (view) {
      case "month":
        return (
          <MonthView
            currentDate={currentDate}
            onDayClick={handleOpenAddDialog}
            projectIds={selectedProjectIdsArray} // Pass array
          />
        );
      case "week":
        return (
          <WeekView
            currentDate={currentDate}
            onTimeSlotClick={handleOpenAddDialog}
            projectIds={selectedProjectIdsArray} // Pass array
          />
        );
      case "day":
        return (
          <DayView
            currentDate={currentDate}
            onTimeSlotClick={handleOpenAddDialog}
            projectIds={selectedProjectIdsArray} // Pass array
          />
        );
      default:
        return null;
    }
  };

  return (
    // This component now renders the full calendar UI including Sidebar
    // The outer div takes the flex properties from the simplified layout.tsx
    <>
      {/* <Sidebar
        currentDate={currentDate}
        selectedProjectId={selectedProjectId}
        onNavigateDate={handleNavigateDate}
        onProjectChange={handleSetProject}
      /> */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {" "}
        {/* Main content area */}
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={handleSetView}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onAddEventClick={() => handleOpenAddDialog()}
        />
        {/* This inner div holds the actual scrolling view */}
        <div className="flex-1 overflow-hidden">{renderView()}</div>
      </div>

      {/* Render Add Event Dialog (controlled by state) */}
      <AddEventDialog
        isOpen={isAddEventDialogOpen}
        onOpenChange={setIsAddEventDialogOpen}
        onClose={handleCloseAddDialog}
        defaultDate={selectedDateForNewEvent}
        projectIds={selectedProjectIdsArray} // Pass array - Dialog needs to handle multi-select context
      />
    </>
  );
}
