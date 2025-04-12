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
  getDay,
  eachWeekOfInterval,
  lastDayOfMonth,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useTasksByProject } from "@/hooks/useTasks"; // Import the hook
import { Task } from "../tasks/data/schema"; // Import Task type
import TaskDetailDialog from "./task-detail-dialog"; // Import the dialog component

interface MonthViewProps {
  currentDate: Date; // First day of the month to display
  // Add props for events, event handlers etc. later
}

// Helper to get days for the calendar grid
const getCalendarDays = (monthDate: Date) => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Week starts Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: startDate, end: endDate });
};

export default function MonthView({ currentDate }: MonthViewProps) {
  // --- Data Fetching ---
  // TODO: Get projectId dynamically later
  const projectId = 6; // Use the same hardcoded project ID as the form for now
  const { data: tasks, isLoading, error } = useTasksByProject(projectId);

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
              "border rounded-md p-1 flex flex-col",
              !isSameMonth(day, currentDate) &&
                "bg-muted/50 text-muted-foreground", // Dim days outside current month
              isToday(day) && "bg-blue-100 dark:bg-blue-900" // Highlight today
            )}
            // Add onClick handler here later
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
                  className="text-xs bg-primary/20 text-primary-foreground rounded px-1 truncate cursor-pointer hover:bg-primary/30"
                  title={task.title} // Show full title on hover
                  onClick={() => handleTaskClick(task)} // Add onClick handler
                >
                  {/* Optionally show time if start_time exists */}
                  {task.start_time
                    ? format(new Date(task.start_time), "HH:mm") + " "
                    : ""}
                  {task.title}
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
        projectId={projectId} // Pass projectId for context
      />
    </div>
  );
}
