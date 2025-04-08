"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // Mini-calendar
import { Plus } from "lucide-react";

export default function Sidebar() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <aside className="w-64 border-r bg-card text-card-foreground p-4 flex flex-col space-y-4">
      <Button className="w-full justify-start pl-3">
        <Plus className="mr-2 h-4 w-4" />
        Create Event
      </Button>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md"
          // Potentially customize styles for a smaller look
        />
      </div>
      {/* Placeholder for event types/calendars list */}
      <div className="flex-1 mt-4 border-t pt-4">
        <h3 className="text-sm font-semibold mb-2">My Calendars</h3>
        {/* List of calendars would go here */}
        <p className="text-xs text-muted-foreground">Calendar list...</p>
      </div>
    </aside>
  );
}
