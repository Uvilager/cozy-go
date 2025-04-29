"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Event } from "@/lib/api/events"; // Import Event type
import { DataTableColumnHeader } from "./data-table-column-header"; // Adjusted path
import { DataTableRowActions } from "./data-table-row-actions"; // Adjusted path
import { format } from "date-fns"; // For formatting dates

export const columns: ColumnDef<Event>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" /> // Changed title
    ),
    cell: ({ row }) => {
      const id = row.getValue("id") as number;
      return <div className="w-[80px]">{`EVENT-${id}`}</div>; // Format for Event ID
    },
    enableSorting: false, // Usually don't sort by internal ID visually
    enableHiding: true, // Can be hidden
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[300px] truncate font-medium">
            {row.getValue("title")}
          </span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return (
        <div className="max-w-[400px] truncate text-sm text-muted-foreground">
          {description || "-"}
        </div>
      );
    },
    enableSorting: false, // Usually don't sort by description
  },
  {
    accessorKey: "start_time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Time" />
    ),
    cell: ({ row }) => {
      const startTime = row.getValue("start_time") as string;
      try {
        // Format the date string (assuming ISO 8601 format from backend)
        return format(new Date(startTime), "Pp"); // e.g., 09/21/2024, 3:30 PM
      } catch (e) {
        return <span className="text-red-500">Invalid Date</span>;
      }
    },
    enableSorting: true,
  },
  {
    accessorKey: "end_time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Time" />
    ),
    cell: ({ row }) => {
      const endTime = row.getValue("end_time") as string;
      try {
        // Format the date string
        return format(new Date(endTime), "Pp");
      } catch (e) {
        return <span className="text-red-500">Invalid Date</span>;
      }
    },
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />, // Will use the adapted actions component
  },
];
