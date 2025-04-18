"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useProjects } from "@/hooks/useProjects"; // Assuming you have this hook
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

// Helper to parse/stringify project IDs from/to URL param
const parseProjectIds = (param: string | null): number[] => {
  if (!param) return [];
  return param.split(",").map(Number).filter(Boolean); // Filter out NaN/0 if parsing fails
};

const stringifyProjectIds = (ids: number[]): string => {
  return ids.join(",");
};

export function MultiProjectSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: projects, isLoading, isError } = useProjects();

  // Local state to manage checked IDs derived from URL
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    parseProjectIds(searchParams.get("projects"))
  );

  // Update local state if URL changes externally
  useEffect(() => {
    setSelectedIds(parseProjectIds(searchParams.get("projects")));
  }, [searchParams]);

  // Function to update URL when checkbox changes
  const handleCheckboxChange = useCallback(
    (projectId: number, checked: boolean | string) => {
      const currentIds = new Set(selectedIds);
      if (checked) {
        currentIds.add(projectId);
      } else {
        currentIds.delete(projectId);
      }
      const newIds = Array.from(currentIds);
      setSelectedIds(newIds); // Update local state immediately

      // Update URL
      const newSearchParams = new URLSearchParams(searchParams.toString());
      if (newIds.length > 0) {
        newSearchParams.set("projects", stringifyProjectIds(newIds));
      } else {
        newSearchParams.delete("projects"); // Remove param if no projects selected
      }
      // Use router.replace for filtering to avoid adding to browser history
      router.replace(`${pathname}?${newSearchParams.toString()}`);
    },
    [selectedIds, searchParams, router, pathname]
  );

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Filter Projects</SidebarGroupLabel>
      <div className="flex flex-col gap-2 p-2 data-[collapsed=true]:hidden">
        {isLoading && (
          <>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </>
        )}
        {isError && (
          <p className="text-xs text-destructive">Error loading projects.</p>
        )}
        {!isLoading &&
          !isError &&
          projects &&
          projects.length > 0 &&
          projects.map((project) => (
            <div key={project.id} className="flex items-center space-x-2">
              <Checkbox
                id={`project-${project.id}`}
                checked={selectedIds.includes(project.id)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(project.id, checked)
                }
              />
              <Label
                htmlFor={`project-${project.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {project.name}
              </Label>
            </div>
          ))}
        {!isLoading && !isError && (!projects || projects.length === 0) && (
          <p className="text-xs text-muted-foreground">No projects found.</p>
        )}
      </div>
    </SidebarGroup>
  );
}
