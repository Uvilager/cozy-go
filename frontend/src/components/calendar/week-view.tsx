"use client";

import React from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  parseISO, // Import parseISO
} from "date-fns";
import { cn } from "@/lib/utils"; // For conditional classes
import { useState, useMemo } from "react"; // Import hooks directly
import { useTasksByProject } from "@/hooks/useTasks"; // Import the hook
import { Task } from "../tasks/data/schema"; // Import Task type
import TaskDetailDialog from "./task-detail-dialog"; // Import the dialog component

interface WeekViewProps {
  currentDate: Date; // Typically the first day of the week to display
  onTimeSlotClick?: (date: Date) => void; // Callback for clicking an empty slot
  // Add props for events, event handlers etc. later
}

export default function WeekView({
  currentDate,
  onTimeSlotClick,
}: WeekViewProps) {
  // Destructure new prop
  // --- State & Data Fetching ---
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // TODO: Get projectId dynamically later
  const projectId = 6; // Use the same hardcoded project ID
  const { data: tasks, isLoading, error } = useTasksByProject(projectId);

  // --- Calendar Calculations ---
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Assuming Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

  // --- Group tasks by date ---
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    if (!tasks) return grouped;
    tasks.forEach((task) => {
      // Group by start_time if available, otherwise due_date
      const dateToSortBy = task.start_time || task.due_date;
      if (dateToSortBy) {
        try {
          const dateKey = format(parseISO(dateToSortBy), "yyyy-MM-dd");
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          // Sort tasks within a day by start time (if available)
          grouped[dateKey].push(task);
          grouped[dateKey].sort((a, b) => {
            const timeA = a.start_time ? parseISO(a.start_time).getTime() : 0;
            const timeB = b.start_time ? parseISO(b.start_time).getTime() : 0;
            return timeA - timeB;
          });
        } catch (e) {
          console.error("Error parsing task date:", dateToSortBy, e);
        }
      }
    });
    return grouped;
  }, [tasks]);

  // --- Handlers ---
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
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
    <div className="flex flex-col h-full">
      {/* Week Header (Days) */}
      <div className="grid grid-cols-[auto_repeat(7,1fr)] sticky top-0 bg-background z-10 border-b">
        {/* Top-left corner spacer */}
        <div className="py-2 border-r"></div>
        {/* Day Headers */}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="text-center font-medium text-sm py-1 border-r last:border-r-0"
          >
            {format(day, "EEE")} {/* Mon, Tue, etc. */}
            <div
              className={cn(
                "text-lg font-semibold",
                isToday(day) && "text-blue-600"
              )}
            >
              {format(day, "d")} {/* 1, 2, etc. */}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable Body (Time Slots & Events) */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[auto_repeat(7,1fr)]">
          {/* Time Column */}
          <div className="row-span-full">
            {hours.map((hour) => (
              <div
                key={`time-${hour}`}
                className="h-12 text-right pr-2 text-xs text-muted-foreground border-r border-b flex items-center justify-end"
              >
                {format(new Date(0, 0, 0, hour), "ha")} {/* 12AM, 1AM, etc. */}
              </div>
            ))}
          </div>

          {/* Event Grid Cells - Render tasks within day columns */}
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate[dayKey] || [];

            return (
              <div
                key={`day-col-${day.toISOString()}`}
                className="relative border-r last:border-r-0"
              >
                {/* Render hour lines */}
                {hours.map((hour) => (
                  <div
                    key={`cell-${day.toISOString()}-${hour}`}
                    className="h-12 border-b cursor-pointer hover:bg-accent/50" // Already has hover
                    onClick={() => {
                      const clickedDateTime = new Date(day);
                      clickedDateTime.setHours(hour, 0, 0, 0); // Set hour, reset minutes/seconds
                      onTimeSlotClick?.(clickedDateTime);
                    }}
                  ></div>
                ))}
                {/* Render tasks for this day (simple list for now, positioning later) */}
                {/* Add pointer-events-none to allow clicks/hovers on underlying slots */}
                <div className="absolute inset-0 p-1 space-y-1 overflow-y-auto pointer-events-none">
                  {dayTasks.map((task) => (
                    <div
                      // Add pointer-events-auto back onto the task itself so it's clickable
                      className="pointer-events-auto group relative flex items-center text-xs bg-primary/10 dark:bg-primary/30 text-primary-foreground rounded px-1 py-0.5 truncate cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/40"
                      key={task.id}
                      title={task.title}
                      onClick={(e) => {
                        e.stopPropagation(); // Keep stopping propagation
                        handleTaskClick(task);
                      }}
                      // TODO: Add absolute positioning based on start/end times
                    >
                      {/* Priority Indicator */}
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
                          ? format(parseISO(task.start_time), "HH:mm")
                          : ""}
                      </span>
                      {/* Title */}
                      <span className="flex-grow truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Render the Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}
