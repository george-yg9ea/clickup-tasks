"use client";

import { ClickUpTask, ClickUpStatus } from "@/types/clickup";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/task-utils";

interface BoardViewProps {
  tasks: ClickUpTask[];
}

function getStatusColumns(tasks: ClickUpTask[]): { status: ClickUpStatus; tasks: ClickUpTask[] }[] {
  const byName = new Map<string, { status: ClickUpStatus; tasks: ClickUpTask[]; minOrderIndex: number }>();
  for (const task of tasks) {
    const s = task.status;
    const statusName = s.status;
    const existing = byName.get(statusName);
    if (existing) {
      existing.tasks.push(task);
      // Update orderindex to the minimum among all statuses with the same name
      existing.minOrderIndex = Math.min(existing.minOrderIndex, s.orderindex);
    } else {
      byName.set(statusName, { status: s, tasks: [task], minOrderIndex: s.orderindex });
    }
  }
  return Array.from(byName.values())
    .filter((col) => col.tasks.length > 0)
    .sort((a, b) => a.minOrderIndex - b.minOrderIndex);
}

export function BoardView({ tasks }: BoardViewProps) {
  const columns = getStatusColumns(tasks);

  if (columns.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No statuses with tasks to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map(({ status, tasks: columnTasks }) => (
          <div
            key={status.status}
            className="flex flex-col w-[280px] min-w-[280px] rounded-lg border bg-muted/30"
          >
            <div
              className="flex items-center gap-2 px-4 py-3 border-b font-medium"
              style={{
                borderLeftWidth: 4,
                borderLeftColor: status.color || "var(--muted-foreground)",
              }}
            >
              <span>{status.status}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {columnTasks.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[70vh]">
              {columnTasks.map((task) => (
                <Card key={task.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <p className="font-semibold text-sm leading-tight">{task.name}</p>
                    <p className="text-muted-foreground text-xs">{task.list.name}</p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-muted-foreground text-xs">
                        {formatDate(task.due_date) ?? "—"}
                      </span>
                      {task.url ? (
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          View →
                        </a>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
