"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options"; // Adjusted path
import { AddEventTableDialog } from "./add/add-event-table-dialog"; // Import the new dialog
// import { AddEventDialog } from "../add/add-event-dialog"; // Placeholder for event dialog import

// Removed status/priority imports and DataTableFacetedFilter import

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  calendarId: number | undefined; // Changed prop name
}

export function DataTableToolbar<TData>({
  table,
  calendarId, // Destructure calendarId
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter events..." // Updated placeholder
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {/* Removed Status and Priority Filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
        {/* Use the AddEventTableDialog, passing the calendarId */}
        <AddEventTableDialog calendarId={calendarId} />
      </div>
    </div>
  );
}
