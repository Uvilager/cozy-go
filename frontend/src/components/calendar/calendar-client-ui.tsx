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
import { useCalendars } from "@/hooks/useCalendar"; // Import the hook to fetch calendars
import { Calendar as CalendarData } from "@/lib/api/calendars"; // Keep type import

interface CalendarClientUIProps {
  // Initial props passed from the server component (page.tsx)
  initialDate?: Date; // Keep initialDate if needed for first load before store hydrates
  initialView?: CalendarView;
  // Remove initialProjectId
  // initialProjectId?: number; // Keep for reference, but not used
}

// Helper to parse calendar IDs from URL param (e.g., "1,2,3")
const parseCalendarIds = (param: string | null): number[] => {
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
  // Get the calendar IDs from the 'calendars' URL parameter (plural)
  const selectedCalendarIdsArray = parseCalendarIds(
    searchParams.get("calendars") // Changed from "calendar" to "calendars"
  );

  // State for the Add Event Dialog
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<
    Date | undefined
  >(undefined);

  // --- Fetch All Calendars ---
  const { data: allCalendars, isLoading: isLoadingCalendars } = useCalendars();

  // --- Filter Calendars based on URL params ---
  const selectableCalendarsDetails: Pick<CalendarData, "id" | "name">[] =
    allCalendars
      ?.filter((cal) => selectedCalendarIdsArray.includes(cal.id))
      .map((cal) => ({ id: cal.id, name: cal.name })) ?? []; // Filter and map, provide default empty array

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
    console.log(
      "handleOpenAddDialog called. Setting isAddEventDialogOpen to true."
    );
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
            calendarIds={selectedCalendarIdsArray} // Pass array
          />
        );
      case "week":
        return (
          <WeekView
            currentDate={currentDate}
            onTimeSlotClick={handleOpenAddDialog}
            calendarIds={selectedCalendarIdsArray} // Pass array
          />
        );
      case "day":
        return (
          <DayView
            currentDate={currentDate}
            onTimeSlotClick={handleOpenAddDialog}
            calendarIds={selectedCalendarIdsArray} // Pass array
          />
        );
      default:
        return null;
    }
  };

  // Removed Debugging Logs

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

      {/* Render Add Event Dialog (controlled by state) - Only if calendars are available */}
      {isAddEventDialogOpen && selectableCalendarsDetails.length > 0 && (
        <AddEventDialog
          isOpen={isAddEventDialogOpen}
          onOpenChange={setIsAddEventDialogOpen}
          onClose={handleCloseAddDialog}
          selectableCalendars={selectableCalendarsDetails} // Pass the detailed list
          defaultStartTime={selectedDateForNewEvent} // Pass the selected date/time as start time
        />
      )}
    </>
  );
}
