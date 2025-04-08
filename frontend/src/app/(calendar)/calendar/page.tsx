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

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
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

  const renderView = () => {
    switch (view) {
      case "month":
        return <MonthView currentDate={currentDate} />;
      // return <div className="p-4">Month View Placeholder</div>;
      case "week":
        return <WeekView currentDate={currentDate} />;
      // return <div className="p-4">Week View Placeholder</div>;
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
      />
      <div className="flex-1 overflow-auto">
        {/* Render the current view component */}
        {renderView()}
      </div>
    </div>
  );
}
