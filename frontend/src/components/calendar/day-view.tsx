"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  format,
  parseISO,
  isSameDay,
  isToday as isTodayCheck,
  getHours,
} from "date-fns";
import { useTasksByProject } from "@/hooks/useTasks";
import { Task } from "../tasks/data/schema";
import TaskDetailDialog from "./task-detail-dialog";

interface DayViewProps {
  currentDate: Date; // The specific day to display
  onTimeSlotClick?: (date: Date) => void; // Callback for clicking an empty slot
  projectIds: number[]; // Add projectId prop
}

export default function DayView({
  currentDate,
  onTimeSlotClick,
  projectIds, // Destructure projectId
}: DayViewProps) {
  // --- State & Data Fetching ---
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // --- Data Fetching ---
  // Use the projectIds array passed from props
  // TODO: Update useTasksByProject hook to accept number[] and filter correctly.
  // Temporary workaround: Pass single ID if exactly one is selected, otherwise undefined.
  const projectIdForHook = projectIds.length === 1 ? projectIds[0] : undefined;
  // Use the projectId passed from props
  const {
    data: allTasks,
    isLoading,
    error,
  } = useTasksByProject(projectIdForHook);

  // --- Calendar Calculations ---
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

  // --- Filter tasks for the current day ---
  const dayTasks = useMemo(() => {
    if (!allTasks) return [];
    return allTasks
      .filter((task) => {
        const dateToSortBy = task.start_time || task.due_date;
        if (!dateToSortBy) return false;
        try {
          return isSameDay(parseISO(dateToSortBy), currentDate);
        } catch (e) {
          console.error(
            "Error parsing task date for filtering:",
            dateToSortBy,
            e
          );
          return false;
        }
      })
      .sort((a, b) => {
        const timeA = a.start_time ? parseISO(a.start_time).getTime() : 0;
        const timeB = b.start_time ? parseISO(b.start_time).getTime() : 0;
        return timeA - timeB;
      });
  }, [allTasks, currentDate]);

  // --- Group tasks by START HOUR ---
  const tasksByHour = useMemo(() => {
    const grouped: Record<number, Task[]> = {}; // Key is hour (0-23)
    dayTasks.forEach((task) => {
      if (task.start_time) {
        // Only group tasks with a start time
        try {
          const startHour = getHours(parseISO(task.start_time));
          if (!grouped[startHour]) {
            grouped[startHour] = [];
          }
          grouped[startHour].push(task);
          // Sorting is already handled by dayTasks sort
        } catch (e) {
          console.error(
            "Error parsing task start_time for grouping:",
            task.start_time,
            e
          );
        }
      }
      // Decide how to handle tasks without start_time (e.g., all-day tasks)
      // Maybe group them under a special key like -1? For now, they are ignored by this grouping.
    });
    return grouped;
  }, [dayTasks]);

  // --- Handlers ---
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  // --- Current Time Indicator Logic ---
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(
    null
  );
  const isCurrentDayDisplayed = isTodayCheck(currentDate);

  useEffect(() => {
    if (!isCurrentDayDisplayed) {
      setCurrentTimePosition(null);
      return;
    }
    const calculatePosition = () => {
      const now = new Date();
      const totalMinutesInDay = 24 * 60;
      const minutesPastMidnight = now.getHours() * 60 + now.getMinutes();
      const percentage = (minutesPastMidnight / totalMinutesInDay) * 100;
      setCurrentTimePosition(percentage);
    };
    calculatePosition();
    const intervalId = setInterval(calculatePosition, 60000);
    return () => clearInterval(intervalId);
  }, [currentDate, isCurrentDayDisplayed]);

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
    <>
      {" "}
      {/* Fragment needed for Dialog */}
      <div className="flex flex-col h-full">
        {/* Scrollable time grid area */}
        <div className="flex-1 overflow-auto p-4">
          <div className="relative grid grid-cols-[auto_1fr] gap-x-2">
            {/* Time column */}
            <div className="flex flex-col sticky top-0 bg-background z-10">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 text-right pr-2 text-xs text-muted-foreground border-b flex items-center justify-end"
                >
                  {format(new Date(0, 0, 0, hour), "ha")}
                </div>
              ))}
            </div>
            {/* Event area */}
            <div className="relative border-l">
              {/* Current Time Indicator Line */}
              {isCurrentDayDisplayed && currentTimePosition !== null && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                  style={{ top: `${currentTimePosition}%` }}
                >
                  <div className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-red-500"></div>
                </div>
              )}

              {/* Hour slots - Render tasks within each slot */}
              {hours.map((hour) => {
                const tasksInHour = tasksByHour[hour] || [];
                return (
                  <div
                    key={`cell-${hour}`}
                    className="h-12 border-b cursor-pointer hover:bg-accent/50 relative" // Add relative for potential absolute positioning of tasks *within* the slot if needed later
                    onClick={() => {
                      const clickedDateTime = new Date(currentDate);
                      clickedDateTime.setHours(hour, 0, 0, 0);
                      onTimeSlotClick?.(clickedDateTime);
                    }}
                  >
                    {/* Render tasks starting in this hour */}
                    <div className="p-1 space-y-0.5">
                      {" "}
                      {/* Container for tasks in this slot */}
                      {tasksInHour.map((task) => (
                        <div
                          key={task.id}
                          className="group relative flex items-center text-xs bg-primary/10 dark:bg-primary/30 text-primary-foreground rounded px-1 truncate cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/40"
                          title={task.title}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent slot click
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
                  </div>
                );
              })}
              {/* Removed the separate absolute positioned task rendering div */}
            </div>
          </div>
        </div>
      </div>
      {/* Render the Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        // No projectId prop needed here anymore
      />
    </>
  );
}
