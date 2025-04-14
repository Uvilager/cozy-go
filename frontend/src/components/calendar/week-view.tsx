"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  parseISO,
  getHours, // Import getHours
} from "date-fns";
import { cn } from "@/lib/utils";
import { useTasksByProject } from "@/hooks/useTasks";
import { Task } from "../tasks/data/schema";
import TaskDetailDialog from "./task-detail-dialog";
import { Badge } from "@/components/ui/badge"; // Keep Badge

interface WeekViewProps {
  currentDate: Date;
  onTimeSlotClick?: (date: Date) => void;
}

export default function WeekView({
  currentDate,
  onTimeSlotClick,
}: WeekViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const projectId = 6; // TODO: Replace hardcoded ID
  const { data: tasks, isLoading, error } = useTasksByProject(projectId);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // --- Group tasks by DATE and then by START HOUR ---
  const tasksByHourAndDay = useMemo(() => {
    const grouped: Record<string, Record<number, Task[]>> = {}; // Key1: yyyy-MM-dd, Key2: hour (0-23)
    if (!tasks) return grouped;

    tasks.forEach((task) => {
      const dateToSortBy = task.start_time || task.due_date;
      if (dateToSortBy) {
        try {
          const dateObj = parseISO(dateToSortBy);
          const dateKey = format(dateObj, "yyyy-MM-dd");
          const startHour = task.start_time
            ? getHours(parseISO(task.start_time))
            : -1; // Use -1 for tasks without start time (all-day?)

          if (!grouped[dateKey]) {
            grouped[dateKey] = {};
          }
          if (startHour >= 0) {
            // Only group timed tasks by hour
            if (!grouped[dateKey][startHour]) {
              grouped[dateKey][startHour] = [];
            }
            grouped[dateKey][startHour].push(task);
            // Sort tasks within the hour
            grouped[dateKey][startHour].sort((a, b) => {
              const timeA = a.start_time ? parseISO(a.start_time).getTime() : 0;
              const timeB = b.start_time ? parseISO(b.start_time).getTime() : 0;
              return timeA - timeB;
            });
          }
          // TODO: Handle tasks without start_time separately if needed (e.g., all-day section)
        } catch (e) {
          console.error(
            "Error parsing task date for grouping:",
            dateToSortBy,
            e
          );
        }
      }
    });
    return grouped;
  }, [tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  if (isLoading) return <div className="p-4 text-center">Loading tasks...</div>;
  if (error)
    return (
      <div className="p-4 text-center text-destructive">
        Error loading tasks: {error.message}
      </div>
    );

  return (
    <>
      {" "}
      {/* Fragment for Dialog */}
      <div className="flex flex-col h-full">
        {/* Week Header */}
        <div className="grid grid-cols-[auto_repeat(7,1fr)] sticky top-0 bg-background z-10 border-b">
          <div className="py-2 border-r"></div> {/* Spacer */}
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="text-center font-medium text-sm py-1 border-r last:border-r-0"
            >
              {format(day, "EEE")}
              <div
                className={cn(
                  "text-lg font-semibold",
                  isToday(day) && "text-blue-600"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[auto_repeat(7,1fr)]">
            {/* Time Column */}
            <div className="row-span-full">
              {hours.map((hour) => (
                <div
                  key={`time-${hour}`}
                  className="h-12 text-right pr-2 text-xs text-muted-foreground border-r border-b flex items-center justify-end"
                >
                  {format(new Date(0, 0, 0, hour), "ha")}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const tasksForDay = tasksByHourAndDay[dayKey] || {}; // Get tasks grouped by hour for this day

              return (
                <div
                  key={`day-col-${day.toISOString()}`}
                  className="relative border-r last:border-r-0"
                >
                  {/* Render hour slots and tasks within them */}
                  {hours.map((hour) => {
                    const tasksInHour = tasksForDay[hour] || []; // Get tasks for this specific hour
                    return (
                      <div
                        key={`cell-${day.toISOString()}-${hour}`}
                        className="h-12 border-b cursor-pointer hover:bg-accent/50 relative p-1 space-y-0.5 overflow-hidden" // Add relative and padding/overflow
                        onClick={() => {
                          const clickedDateTime = new Date(day);
                          clickedDateTime.setHours(hour, 0, 0, 0);
                          onTimeSlotClick?.(clickedDateTime);
                        }}
                      >
                        {/* Render tasks starting in this hour */}
                        {tasksInHour.map((task) => (
                          <div
                            key={task.id}
                            className="group relative flex items-center text-xs bg-primary/10 dark:bg-primary/30 text-primary-foreground rounded px-1 truncate cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/40"
                            title={task.title}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
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
                            <span className="flex-grow truncate">
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {/* Removed the separate absolute positioned task rendering div */}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Render the Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        projectId={projectId}
      />
    </>
  );
}
