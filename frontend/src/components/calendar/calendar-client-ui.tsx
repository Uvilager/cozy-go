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
} from "date-fns";
import Sidebar from "./sidebar";
import CalendarHeader, { CalendarView } from "./header";
import MonthView from "./month-view";
import WeekView from "./week-view";
import DayView from "./day-view";
import AddEventDialog from "./add/add-event-dialog";

interface CalendarClientUIProps {
  // Initial props passed from the server component (page.tsx)
  initialDate?: Date;
  initialView?: CalendarView;
  initialProjectId?: number;
  // Pass prefetched projects if needed by ProjectPicker directly
  // initialProjects?: Project[];
}

export default function CalendarClientUI({
  initialDate,
  initialView,
  initialProjectId,
}: CalendarClientUIProps) {
  // --- State Management ---
  const [view, setView] = useState<CalendarView>(initialView || "month");
  const [currentDate, setCurrentDate] = useState<Date>(
    initialDate || startOfMonth(new Date())
  );
  const [selectedProjectId, setSelectedProjectId] = useState<
    number | undefined
  >(initialProjectId);

  // State for the Add Event Dialog
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<
    Date | undefined
  >(undefined);

  // --- Handlers ---
  const handleSetView = (newView: CalendarView) => {
    setView(newView);
    let newReferenceDate = currentDate;
    if (newView === "month") {
      newReferenceDate = startOfMonth(currentDate);
    } else if (newView === "week") {
      newReferenceDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    }
    if (newReferenceDate.getTime() !== currentDate.getTime()) {
      setCurrentDate(newReferenceDate);
    }
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
    setCurrentDate(newReferenceDate);
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
    setCurrentDate(newDate);
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
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    handleNavigateDate(new Date());
  };

  const handleSetProject = (id: number | undefined) => {
    console.log("CalendarClientUI: Project selected:", id);
    setSelectedProjectId(id);
    // TODO: Update URL if desired?
  };

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
            projectId={selectedProjectId}
          />
        );
      case "week":
        return (
          <WeekView
            currentDate={currentDate}
            onTimeSlotClick={handleOpenAddDialog}
            projectId={selectedProjectId}
          />
        );
      case "day":
        return (
          <DayView
            currentDate={currentDate}
            onTimeSlotClick={handleOpenAddDialog}
            projectId={selectedProjectId}
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
      <Sidebar
        currentDate={currentDate}
        selectedProjectId={selectedProjectId}
        onNavigateDate={handleNavigateDate}
        onProjectChange={handleSetProject}
      />
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
        projectId={selectedProjectId} // Pass project ID to the Add dialog/form
      />
    </>
  );
}
