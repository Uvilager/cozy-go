"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Check,
  ChevronsUpDown,
  FolderKanban,
  Plus,
  MoreHorizontal,
} from "lucide-react"; // Add MoreHorizontal
import { cn } from "@/lib/utils"; // Corrected path
import { useProjects } from "@/hooks/useProjects";
import { Project } from "@/lib/api"; // Assuming Project type is here
// Import createProject API function when available
// import { createProject } from "@/lib/api";
import { AddProjectDialog } from "./add/add-project-dialog"; // Import the new dialog component
import { EditProjectDialog } from "./edit/edit-project-dialog"; // Import Edit Dialog
import { DeleteProjectDialog } from "./delete/delete-project-dialog"; // Import Delete Dialog
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components

interface ProjectPickerProps {
  currentProjectId: string | undefined; // Project ID from URL params
}

export function ProjectPicker({ currentProjectId }: ProjectPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // State for edit/delete dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Fetch projects using the hook
  const { data: projectsData, isLoading, isError, error } = useProjects();
  const projects = useMemo(() => projectsData ?? [], [projectsData]);

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
                  // Wrap CommandItem content in a div for flex layout
                  <div
                    key={project.id}
                    className="flex items-center justify-between w-full"
                  >
                    <CommandItem
                      value={project.id.toString()}
                      onSelect={() =>
                        handleProjectSelect(project.id.toString())
                      }
                      className="flex-grow cursor-pointer" // Make item take space and be clickable
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedProject?.id === project.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="truncate">{project.name}</span>
                    </CommandItem>
                    {/* Dropdown Menu for Edit/Delete */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 px-1 h-auto" // Adjust padding/height
                          onClick={(e) => e.stopPropagation()} // Prevent item selection
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()} // Prevent closing popover
                      >
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditingProject(project);
                            setEditDialogOpen(true);
                            setPopoverOpen(false); // Close popover
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setDeletingProject(project);
                            setDeleteDialogOpen(true);
                            setPopoverOpen(false); // Close popover
                          }}
                          className="text-red-600" // Destructive action style
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

      {/* Render Edit Dialog */}
      <EditProjectDialog
        project={editingProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditingProject(null); // Clear editing project on success/close
          // Optionally refetch or rely on cache invalidation from hook
        }}
      />

      {/* Render Delete Dialog */}
      <DeleteProjectDialog
        project={deletingProject}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={() => {
          setDeletingProject(null); // Clear deleting project on success/close
          // If the deleted project was the selected one, clear selection or select first
          if (selectedProject?.id === deletingProject?.id) {
            const remainingProjects = projects.filter(
              (p) => p.id !== deletingProject?.id
            );
            if (remainingProjects.length > 0) {
              handleProjectSelect(remainingProjects[0].id.toString());
            } else {
              // Handle case where no projects are left - maybe navigate away or show message
              setSelectedProject(null);
              // Force page reload or navigate to clear tasks if needed
              router.push("/tasks"); // Navigate to tasks page without project id
            }
          }
        }}
      />
    </>
  );
}
