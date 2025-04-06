"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient
// Import useMutation if/when create project functionality is added
// import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button"; // Corrected path
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"; // Corrected path
// Dialog related imports are no longer needed here
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Corrected path
// Input, Label, Textarea are no longer needed here
import { Check, ChevronsUpDown, FolderKanban, Plus } from "lucide-react";
import { cn } from "@/lib/utils"; // Corrected path
import { useProjects } from "@/hooks/useProjects";
import { Project } from "@/lib/api"; // Assuming Project type is here
// Import createProject API function when available
// import { createProject } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { AddProjectDialog } from "./add/add-project-dialog"; // Import the new dialog component

interface ProjectPickerProps {
  currentProjectId: string | undefined; // Project ID from URL params
}

export function ProjectPicker({ currentProjectId }: ProjectPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient(); // Get query client instance

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false); // Re-add state for dialog
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch projects using the hook
  const { data: projectsData, isLoading, isError, error } = useProjects();
  const projects = projectsData ?? [];

  // --- TODO: Implement Project Creation Mutation ---
  // const createProjectMutation = useMutation({
  //   mutationFn: createProject, // Replace with your actual API call
  //   onSuccess: (newProject) => {
  //     queryClient.invalidateQueries({ queryKey: queryKeys.projects }); // Refetch projects
  //     handleProjectSelect(newProject.id.toString()); // Select the new project
  //     setCreateDialogOpen(false); // Close dialog
  //   },
  //   onError: (error) => {
  //     console.error("Failed to create project:", error);
  //     // Handle error display to user, e.g., using a toast notification
  //   },
  // });

  // Determine the selected project based on URL param or default to first project
  useEffect(() => {
    if (projects.length > 0) {
      const projectFromUrl = currentProjectId
        ? projects.find((p) => p.id.toString() === currentProjectId)
        : undefined;
      setSelectedProject(projectFromUrl || projects[0]);
    } else {
      setSelectedProject(null);
    }
  }, [currentProjectId, projects]);

  // Update URL search params when a project is selected
  const handleProjectSelect = (projectId: string) => {
    const project = projects.find((p) => p.id.toString() === projectId);
    if (project) {
      setSelectedProject(project); // Update local state

      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("projectId", projectId);
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`/tasks${query}`); // Navigate to update server component data

      setPopoverOpen(false); // Close the popover
    }
  };

  // // Handle form submission for creating a new project - REMOVED (now in AddProjectForm)
  // const handleCreateProjectSubmit = ...

  // Loading and Error States
  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-[220px] justify-start">
        Loading projects...
      </Button>
    );
  }

  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load projects";
    return (
      <Button
        variant="destructive"
        disabled
        className="w-[220px] justify-start"
      >
        Error: {errorMessage}
      </Button>
    );
  }

  if (!projects || projects.length === 0) {
    // Render Button to trigger dialog and the controlled Dialog component
    return (
      <>
        <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Project
        </Button>
        <AddProjectDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          // Optional: Add onSuccess handler if needed
        />
      </>
    );
  }

  // Main component render when projects exist
  return (
    // Wrap Popover and Dialog in a Fragment
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            aria-label="Select a project"
            className="w-[220px] justify-between"
          >
            {selectedProject ? (
              <div className="flex items-center gap-2 truncate">
                <FolderKanban className="h-4 w-4 shrink-0 opacity-50" />
                <span className="truncate">{selectedProject.name}</span>
              </div>
            ) : (
              "Select project..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0">
          <Command>
            <CommandInput placeholder="Search projects..." />
            <CommandList>
              <CommandEmpty>No projects found.</CommandEmpty>
              <CommandGroup>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.id.toString()} // Use string ID for value/onSelect
                    onSelect={() => handleProjectSelect(project.id.toString())}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProject?.id === project.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {project.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                {/* CommandItem now just sets the state to open the dialog */}
                <CommandItem
                  onSelect={() => {
                    setPopoverOpen(false); // Close popover first
                    setCreateDialogOpen(true); // Then open dialog
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Render the controlled AddProjectDialog */}
      <AddProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        // Optional: Add onSuccess handler if needed
        // onSuccess={() => console.log("Project created successfully!")}
      />
    </>
  );
}
