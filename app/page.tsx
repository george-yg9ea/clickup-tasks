"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderKanban, List } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { DataTable } from "@/components/data-table";
import { groupedColumns, flatColumns } from "./columns";
import { ClickUpTask } from "@/types/clickup";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { buildProjectTree, buildSubtaskTree } from "@/lib/task-utils";

type ViewMode = "grouped" | "all";

export default function Home() {
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const response = await fetch("/api/tasks");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch tasks");
        }

        const data = await response.json();
        setTasks(data.tasks || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  const groupedData = useMemo(() => buildProjectTree(tasks), [tasks]);
  const flatData = useMemo(() => buildSubtaskTree(tasks), [tasks]);

  const data = viewMode === "grouped" ? groupedData : flatData;
  const columns = viewMode === "grouped" ? groupedColumns : flatColumns;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive p-4 text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {tasks.length === 0 ? (
              <div className="rounded-md border p-8 text-center text-muted-foreground">
                No tasks found
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-1 rounded-lg border p-1 w-fit">
                  <Button
                    variant={viewMode === "grouped" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setViewMode("grouped")}
                  >
                    <FolderKanban className="mr-1.5 h-3.5 w-3.5" />
                    Group by Project
                  </Button>
                  <Button
                    variant={viewMode === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setViewMode("all")}
                  >
                    <List className="mr-1.5 h-3.5 w-3.5" />
                    All Tasks
                  </Button>
                </div>
                <DataTable columns={columns} data={data} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
