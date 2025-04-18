"use client";

import React, { useState } from "react"; // Import useState
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks"; // Import the updated hook
import { Task } from "../tasks/data/schema"; // Import Task type
import TaskDetailDialog from "./task-detail-dialog"; // Import the dialog component

interface MonthViewProps {
  currentDate: Date; // First day of the month to display
  onDayClick?: (date: Date) => void; // Add callback for clicking a day cell
  projectIds: number[]; // Changed from projectId to projectIds array
}

// Helper to get days for the calendar grid
const getCalendarDays = (monthDate: Date) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Week starts Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: startDate, end: endDate });
};

export default function MonthView({
  currentDate,
  onDayClick,
  projectIds, // Use projectIds prop
}: MonthViewProps) {
  // --- Data Fetching ---
  // Use the projectIds array passed from props with the updated useTasks hook
  const { data: tasks, isLoading, error } = useTasks(projectIds);

  // --- State for Task Detail/Edit ---
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // --- Calendar Grid Calculation ---
  const daysInGrid = getCalendarDays(currentDate);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // --- Group tasks by date for easier rendering ---
  // Create a map where key is date string (YYYY-MM-DD) and value is array of tasks
  const tasksByDate = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    if (!tasks) return grouped;

    tasks.forEach((task) => {
      // Use due_date for grouping for now. Adapt if using start_time later.
      if (task.due_date) {
        try {
          const dateKey = format(new Date(task.due_date), "yyyy-MM-dd");
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(task);
        } catch (e) {
          console.error("Error parsing task due_date:", task.due_date, e);
        }
      }
    });
    return grouped;
  }, [tasks]);

  // --- Handler for clicking a task ---
  const handleTaskClick = (task: Task) => {
    console.log("Task clicked:", task);
    setSelectedTask(task);
    setIsDetailOpen(true);
    // TODO: Implement Task Detail Dialog/Modal component here
  };

  // --- Rendering ---
  if (isLoading) {
    return <div className="p-4 text-center">Loading tasks...</div>;
  }
  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Error loading tasks: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Days of the week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1">
        {daysInGrid.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "border rounded-md p-1 flex flex-col cursor-pointer hover:bg-accent hover:text-accent-foreground", // Add cursor/hover
              !isSameMonth(day, currentDate) &&
                "bg-muted/50 text-muted-foreground", // Dim days outside current month
              isToday(day) && "bg-blue-100 dark:bg-blue-900" // Highlight today
            )}
            onClick={() => onDayClick?.(day)} // Call onDayClick prop when cell is clicked
          >
            <span
              className={cn(
                "text-xs self-end",
                isToday(day) && "text-blue-700 dark:text-blue-300 font-bold"
              )}
            >
              {format(day, "d")}
            </span>
            <div className="flex-1 overflow-y-auto mt-1 space-y-0.5">
              {/* Render tasks for this day */}
              {(tasksByDate[format(day, "yyyy-MM-dd")] || []).map((task) => (
                <div
                  key={task.id}
                  className="group relative flex items-center text-xs bg-primary/10 dark:bg-primary/30 text-primary-foreground rounded px-1 py-0.5 truncate cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/40"
                  title={task.title} // Show full title on hover
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent day click handler when clicking task
                    handleTaskClick(task);
                  }}
                >
                  {/* Simple Priority Indicator (e.g., colored dot) - Customize as needed */}
                  {task.priority === "high" && (
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                  )}
                  {task.priority === "medium" && (
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-yellow-500 flex-shrink-0"></span>
                  )}
                  {task.priority === "low" && (
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                  )}

                  {/* Time */}
                  <span className="mr-1 flex-shrink-0">
                    {task.start_time
                      ? format(new Date(task.start_time), "HH:mm")
                      : ""}
                  </span>

                  {/* Title */}
                  <span className="flex-grow truncate">{task.title}</span>

                  {/* Optional: Label Badge (keep it small) - shown on hover? */}
                  {/* <Badge variant="secondary" className="absolute right-1 top-1/2 -translate-y-1/2 scale-75 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.label}
                  </Badge> */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for Task Detail Dialog */}
      {/* {isDetailOpen && selectedTask && (
         <TaskDetailDialog
           task={selectedTask}
           isOpen={isDetailOpen}
           onClose={() => setIsDetailOpen(false)}
           // Pass necessary props like projectId for potential updates/deletions
           projectId={projectId}
         />
       )}

       {/* Render the Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        // No projectId prop needed here anymore
      />
    </div>
  );
}
