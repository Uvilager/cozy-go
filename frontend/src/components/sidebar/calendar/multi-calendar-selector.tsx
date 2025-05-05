"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCalendars } from "@/hooks/useCalendar"; // Import the calendars hook
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

// Helper to parse/stringify calendar IDs from/to URL param
const parseCalendarIds = (param: string | null): number[] => {
  // Renamed function
  if (!param) return [];
  return param.split(",").map(Number).filter(Boolean); // Filter out NaN/0 if parsing fails
};

const stringifyCalendarIds = (ids: number[]): string => {
  // Renamed function
  return ids.join(",");
};

export function MultiCalendarSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: calendars, isLoading, isError } = useCalendars(); // Use useCalendars hook and rename data

  // Local state to manage checked IDs derived from URL
  const [selectedIds, setSelectedIds] = useState<number[]>(
    () => parseCalendarIds(searchParams.get("calendars")) // Use new function and param name
  );
  const [defaultApplied, setDefaultApplied] = useState(false); // Track if default has been applied

  // Update local state if URL changes externally
  useEffect(() => {
    setSelectedIds(parseCalendarIds(searchParams.get("calendars"))); // Use new function and param name
  }, [searchParams]);

  // Effect to set default selection if URL param is missing and calendars are loaded
  useEffect(() => {
    const currentParam = searchParams.get("calendars");
    // Only proceed if the param is missing, default hasn't been applied,
    // calendars are loaded, and there's at least one calendar
    if (
      !currentParam &&
      !defaultApplied &&
      !isLoading &&
      calendars &&
      calendars.length > 0
    ) {
      const defaultCalendarId = calendars[0].id;
      const defaultIds = [defaultCalendarId];

      // Update local state
      setSelectedIds(defaultIds);
      // Mark default as applied
      setDefaultApplied(true);

      // Update URL without adding to history
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set("calendars", stringifyCalendarIds(defaultIds));
      router.replace(`${pathname}?${newSearchParams.toString()}`);
    }
    // Run this effect when loading state changes, calendars data changes,
    // the URL param changes, or the defaultApplied flag changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, calendars, searchParams.get("calendars"), defaultApplied]);

  // Function to update URL when checkbox changes
  const handleCheckboxChange = useCallback(
    (calendarId: number, checked: boolean | string) => {
      // Renamed parameter
      const currentIds = new Set(selectedIds);
      if (checked) {
        currentIds.add(calendarId); // Use renamed parameter
      } else {
        currentIds.delete(calendarId); // Use renamed parameter
      }
      const newIds = Array.from(currentIds);
      setSelectedIds(newIds); // Update local state immediately

      // Update URL
      const newSearchParams = new URLSearchParams(searchParams.toString());
      if (newIds.length > 0) {
        newSearchParams.set("calendars", stringifyCalendarIds(newIds)); // Use new param name and function
      } else {
        newSearchParams.delete("calendars"); // Use new param name
      }
      // Use router.replace for filtering to avoid adding to browser history
      router.replace(`${pathname}?${newSearchParams.toString()}`);
    },
    [selectedIds, searchParams, router, pathname]
  );

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Filter Calendars</SidebarGroupLabel>
      <div className="flex flex-col gap-2 p-2 data-[collapsed=true]:hidden">
        {isLoading && (
          <>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </>
        )}
        {isError && (
          <p className="text-xs text-destructive">Error loading calendars.</p>
        )}
        {!isLoading &&
          !isError &&
          calendars && // Use calendars variable
          calendars.length > 0 &&
          calendars.map(
            (
              calendar // Map over calendars
            ) => (
              <div key={calendar.id} className="flex items-center space-x-2">
                {" "}
                {/* Use calendar.id */}
                <Checkbox
                  id={`calendar-${calendar.id}`} // Use calendar.id
                  checked={selectedIds.includes(calendar.id)} // Use calendar.id
                  onCheckedChange={
                    (checked) => handleCheckboxChange(calendar.id, checked) // Use calendar.id
                  }
                />
                <Label
                  htmlFor={`calendar-${calendar.id}`} // Use calendar.id
                  className="text-sm font-normal cursor-pointer"
                >
                  {calendar.name} {/* Use calendar.name */}
                </Label>
              </div>
            )
          )}
        {!isLoading &&
          !isError &&
          (!calendars || calendars.length === 0) && ( // Check calendars variable
            <p className="text-xs text-muted-foreground">No calendars found.</p>
          )}
      </div>
    </SidebarGroup>
  );
}
