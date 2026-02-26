"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";
import { ClickUpTask } from "@/types/clickup";
import { Skeleton } from "@/components/ui/skeleton";
import { buildTaskTree } from "@/lib/task-utils";

export default function Home() {
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const treeData = useMemo(() => buildTaskTree(tasks), [tasks]);

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
              <DataTable columns={columns} data={treeData} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
