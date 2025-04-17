"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { ProjectPicker } from "@/components/projects/project-picker";
import TaskTableClient from "@/components/tasks/task-table-client";
// import { Skeleton } from "@/components/ui/skeleton"; // Remove temporary skeleton import

interface TasksViewProps {
  // Initial project ID derived from URL search param on the server
  initialProjectId?: number | undefined;
}

export default function TasksView({ initialProjectId }: TasksViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // To read params if needed, though initial is passed

  // State to hold the currently selected project ID
  const [selectedProjectId, setSelectedProjectId] = useState<
    number | undefined
  >(initialProjectId);

  // Fetch projects
  const {
    data: projects,
    isLoading: isLoadingProjects,
    isError,
    error,
  } = useProjects();

  // Effect to handle default project selection and URL sync
  useEffect(() => {
    // Only run if projects have loaded and no project is currently selected
    if (
      !isLoadingProjects &&
      projects &&
      projects.length > 0 &&
      selectedProjectId === undefined
    ) {
      console.log(
        "TasksView: No project selected, defaulting to first project."
      );
      const defaultProject = projects[0];
      setSelectedProjectId(defaultProject.id);

      // Update URL without adding to history, triggering server component refetch if needed by other parts
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("projectId", defaultProject.id.toString());
      const search = current.toString();
      const query = search ? `?${search}` : "";
      // Use replace to avoid polluting browser history on initial default selection
      router.replace(`/tasks${query}`);
    }
    // If initialProjectId was passed but isn't valid according to fetched projects,
    // this logic will also select the first valid project.
  }, [projects, isLoadingProjects, selectedProjectId, router, searchParams]);

  // Handler for when the project picker selection changes
  const handleProjectChange = (projectIdStr: string | undefined) => {
    const newProjectId = projectIdStr ? parseInt(projectIdStr, 10) : undefined;
    if (!isNaN(newProjectId as number) || newProjectId === undefined) {
      const validProjectId = newProjectId as number | undefined;
      console.log("TasksView: Project changed to:", validProjectId);
      setSelectedProjectId(validProjectId);

      // Update URL with push to allow back navigation
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (validProjectId !== undefined) {
        current.set("projectId", validProjectId.toString());
      } else {
        current.delete("projectId"); // Remove if 'All Projects' or similar is selected
      }
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`/tasks${query}`);
    } else {
      console.warn("Invalid project ID received from picker:", projectIdStr);
    }
  };

  // --- Render Logic ---

  if (isError) {
    return (
      <div className="p-4 text-destructive">
        Error loading projects: {error?.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-10 pb-16 md:block">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            Manage your tasks and track your progress.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Render ProjectPicker directly or show simple loading text */}
          {isLoadingProjects ? (
            <div className="text-sm text-muted-foreground">
              Loading projects...
            </div>
          ) : (
            <ProjectPicker
              // Pass the string version of the selected ID back to picker
              // ProjectPicker expects string | undefined based on previous usage
              currentProjectId={selectedProjectId?.toString()}
              // Pass the handler that updates state and pushes router
              onProjectChange={handleProjectChange}
            />
          )}
          {/* TODO: Add Task Button - needs selectedProjectId */}
          {/* <AddTaskDialog projectId={selectedProjectId} /> */}
        </div>
      </div>

      {/* Task Table Section */}
      {selectedProjectId !== undefined ? (
        <TaskTableClient projectId={selectedProjectId} />
      ) : (
        // Show message if still loading projects or if no projects exist/selected
        <div>
          {isLoadingProjects
            ? "Loading projects..."
            : "Please select a project to view its tasks."}
        </div>
      )}
    </div>
  );
}
