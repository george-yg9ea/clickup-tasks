"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderKanban, List, Eye, EyeOff, CalendarDays } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { DataTable } from "@/components/data-table";
import { groupedColumns, flatColumns } from "./columns";
import { ClickUpTask } from "@/types/clickup";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { buildProjectTree, buildSubtaskTree } from "@/lib/task-utils";
import { WeekView } from "./week-view";

type ViewMode = "grouped" | "all" | "week";

export function Dashboard({ initialName }: { initialName: string | null }) {
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showDone, setShowDone] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);

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
        if (data.userName) {
          const firstName = data.userName.split(" ")[0];
          document.cookie = `tasks_user_name=${encodeURIComponent(firstName)}; path=/; max-age=31536000; SameSite=Lax`;
        }
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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const status = task.status.status.toLowerCase();
      if (!showDone && status === "done") return false;
      if (!showBacklog && status === "backlog") return false;
      if (!showRecurring && status === "recurring tasks") return false;
      return true;
    });
  }, [tasks, showDone, showBacklog, showRecurring]);

  const groupedData = useMemo(() => buildProjectTree(filteredTasks), [filteredTasks]);
  const flatData = useMemo(() => buildSubtaskTree(filteredTasks), [filteredTasks]);

  const data = viewMode === "grouped" ? groupedData : flatData;
  const columns = viewMode === "grouped" ? groupedColumns : flatColumns;

  return (
    <div className="min-h-screen bg-background">
      <Navbar initialName={initialName} />
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
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg border p-1 w-fit">
                    <Button
                      variant={viewMode === "week" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setViewMode("week")}
                    >
                      <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                      Week
                    </Button>
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
                  <div className="flex items-center gap-1 rounded-lg border p-1">
                    <Button
                      variant={showDone ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowDone(!showDone)}
                    >
                      {showDone ? (
                        <Eye className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <EyeOff className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                      )}
                      Done
                    </Button>
                    <Button
                      variant={showBacklog ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowBacklog(!showBacklog)}
                    >
                      {showBacklog ? (
                        <Eye className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <EyeOff className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                      )}
                      Backlog
                    </Button>
                    <Button
                      variant={showRecurring ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowRecurring(!showRecurring)}
                    >
                      {showRecurring ? (
                        <Eye className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <EyeOff className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                      )}
                      Recurring
                    </Button>
                  </div>
                </div>
                {viewMode === "week" ? (
                  <WeekView tasks={filteredTasks} />
                ) : (
                  <DataTable
                    key={viewMode}
                    columns={columns}
                    data={data}
                    defaultSort={viewMode === "all" ? [{ id: "date_created", desc: true }] : []}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
