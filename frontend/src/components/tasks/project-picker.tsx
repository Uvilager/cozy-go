"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming you have a Select component from shadcn/ui

// Define a simple type for the project prop
interface Project {
  id: number;
  name: string;
  // Add other relevant project fields if needed
}

interface ProjectPickerProps {
  projects: Project[];
  currentProjectId: string | undefined; // Project ID from URL params
}

export function ProjectPicker({
  projects,
  currentProjectId,
}: ProjectPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleValueChange = (projectId: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries())); // Create mutable copy

    if (!projectId) {
      current.delete("projectId");
    } else {
      current.set("projectId", projectId);
    }

    // Cast to string
    const search = current.toString();
    // or const query = `${'?'.repeat(search.length && 1)}${search}`;
    const query = search ? `?${search}` : "";

    // Navigate to the same page but with the new query parameter
    // This will trigger a re-render of the Server Component (TasksPage)
    router.push(`/tasks${query}`);
  };

  // Determine the selected value for the Select component
  // Default to the first project if none is selected via URL or if the selected one is invalid
  const selectedValue =
    currentProjectId &&
    projects.some((p) => p.id.toString() === currentProjectId)
      ? currentProjectId
      : projects.length > 0
      ? projects[0].id.toString()
      : undefined;

  // If there are no projects or only one, maybe don't render the picker?
  // Or render it disabled? For now, let's render it.
  if (!projects || projects.length === 0) {
    return <div className="mb-4">No projects available.</div>;
  }

  return (
    <div className="mb-4 max-w-xs">
      {" "}
      {/* Added margin-bottom and max-width */}
      <Select onValueChange={handleValueChange} value={selectedValue}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id.toString()}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
