"use client";

import React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; // Import Plus icon
import { cn } from "@/lib/utils"; // For conditional button styling

export type CalendarView = "month" | "week" | "day";

interface CalendarHeaderProps {
  currentDate: Date; // The reference date for the current view (e.g., first day of the month/week)
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  // Format the displayed date range based on the view
  const displayDate = () => {
    switch (view) {
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week":
        // You might want a more sophisticated week range calculation later
        return `Week of ${format(currentDate, "MMM d, yyyy")}`;
      case "day":
        return format(currentDate, "MMMM d, yyyy");
      default:
        return format(currentDate, "MMMM yyyy");
    }
  };

  return (
    <header className="flex items-center justify-between p-4 border-b">
      {/* Left Side: Navigation */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={onToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-medium ml-4 min-w-[180px] text-center">
          {displayDate()}
        </h2>
      </div>

      {/* Right Side: View Switcher & Create Button */}
      <div className="flex items-center space-x-2">
        <Button
          variant={view === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange("day")}
        >
          Day
        </Button>
        <Button
          variant={view === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange("week")}
        >
          Week
        </Button>
        <Button
          variant={view === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange("month")}
        >
          Month
        </Button>
        <Button size="sm" className="ml-4">
          <Plus className="mr-1 h-4 w-4" />
          Create Task
          {/* Add onClick handler later */}
        </Button>
        {/* Placeholder for other items */}
      </div>
    </header>
  );
}
