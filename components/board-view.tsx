"use client";

import { ClickUpTask, ClickUpStatus } from "@/types/clickup";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
      existing.minOrderIndex = Math.min(existing.minOrderIndex, s.orderindex);
    } else {
      byName.set(statusName, { status: s, tasks: [task], minOrderIndex: s.orderindex });
    }
  }
  return Array.from(byName.values())
    .filter((col) => col.tasks.length > 0)
    .sort((a, b) => a.minOrderIndex - b.minOrderIndex);
}

function getTaskCode(taskId: string): string {
  return taskId.slice(-6).toUpperCase();
}

function getPriorityVariant(priority: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (!priority) return "outline";
  const p = priority.toLowerCase();
  if (p === "urgent" || p === "high") return "destructive";
  if (p === "normal" || p === "medium") return "default";
  if (p === "low") return "secondary";
  return "outline";
}

function calculateProgress(task: ClickUpTask): number {
  if (task.time_estimate && task.time_spent) {
    return Math.min(100, Math.round((task.time_spent / task.time_estimate) * 100));
  }
  return 0;
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
            className="flex flex-col w-[300px] min-w-[300px] rounded-lg border bg-muted/50"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{status.status}</h3>
              </div>
              <Badge variant="secondary" className="text-xs font-medium">
                {columnTasks.length}
              </Badge>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-3 p-3 overflow-y-auto max-h-[calc(100vh-200px)]">
              {columnTasks.map((task) => {
                const progress = calculateProgress(task);
                const taskCode = getTaskCode(task.id);

                return (
                  <Card
                    key={task.id}
                    className="group cursor-pointer transition-all hover:shadow-md bg-background border"
                    onClick={() => {
                      if (task.url) {
                        window.open(task.url, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Task Code and Priority */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-muted-foreground">
                            {taskCode}
                          </span>
                          {task.priority && (
                            <Badge
                              variant={getPriorityVariant(task.priority.priority)}
                              className="text-xs h-5 px-1.5"
                              style={{
                                backgroundColor: task.priority.color
                                  ? `${task.priority.color}15`
                                  : undefined,
                                borderColor: task.priority.color || undefined,
                                color: task.priority.color || undefined,
                              }}
                            >
                              {task.priority.priority}
                            </Badge>
                          )}
                        </div>
                        {progress > 0 && (
                          <div className="text-xs font-semibold text-muted-foreground">
                            {progress}%
                          </div>
                        )}
                      </div>

                      {/* Task Title */}
                      <h4 className="font-semibold text-sm leading-snug line-clamp-2">
                        {task.name}
                      </h4>

                      {/* Progress Bar */}
                      {progress > 0 && (
                        <Progress value={progress} className="h-1.5" />
                      )}

                      {/* List/Project Info */}
                      <div className="text-xs text-muted-foreground">
                        {task.list.name}
                        {task.project.name && ` • ${task.project.name}`}
                      </div>

                      {/* Footer: Assignees and Due Date */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 -space-x-1">
                          {task.assignees.slice(0, 3).map((assignee) => (
                            <Avatar
                              key={assignee.id}
                              className="h-6 w-6 border-2 border-background"
                            >
                              <AvatarImage src={assignee.profilePicture} alt={assignee.username} />
                              <AvatarFallback
                                className="text-[10px]"
                                style={{ backgroundColor: assignee.color || undefined }}
                              >
                                {assignee.initials || assignee.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                          {task.assignees.length === 0 && (
                            <span className="text-xs text-muted-foreground">No assignees</span>
                          )}
                        </div>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
