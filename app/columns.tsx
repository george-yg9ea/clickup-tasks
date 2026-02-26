"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ChevronRight } from "lucide-react";
import { ClickUpTask } from "@/types/clickup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusColor } from "@/lib/task-utils";

function Truncate({
  children,
  className = "",
  maxWidth = "max-w-[200px]",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  title?: string;
}) {
  return (
    <div
      className={`truncate ${maxWidth} ${className}`}
      title={title ?? (typeof children === "string" ? children : undefined)}
    >
      {children}
    </div>
  );
}

function CellLink({
  href,
  children,
  className = "",
  maxWidth = "max-w-[200px]",
  title,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  title?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`truncate ${maxWidth} ${className} text-primary hover:underline block`}
      title={title ?? (typeof children === "string" ? children : undefined)}
    >
      {children}
    </a>
  );
}

/** Build ClickUp list view URL from task (team_id + list.id). */
function listUrl(teamId: string, listId: string): string {
  return `https://app.clickup.com/${teamId}/v/li/${listId}`;
}


export const columns: ColumnDef<ClickUpTask>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent group"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Task
        <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity ${
          column.getIsSorted() ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`} />
      </Button>
    ),
    cell: ({ row }) => {
      const canExpand = row.getCanExpand();
      const isProjectGroup = row.original._isProjectGroup;
      const isVirtual = row.original._isVirtualParent;
      const indent = isProjectGroup ? 0 : (row.depth - 1) * 24;

      return (
        <div
          className="flex items-center gap-1"
          style={{ paddingLeft: `${Math.max(0, indent)}px` }}
        >
          {canExpand ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-muted transition-colors"
            >
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  row.getIsExpanded() ? "rotate-90" : ""
                }`}
              />
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}
          {isProjectGroup ? (
            row.original.url ? (
              <CellLink
                href={row.original.url}
                maxWidth="max-w-[400px]"
                title={row.original.name}
                className="font-semibold text-sm"
              >
                {row.original.name}
              </CellLink>
            ) : (
              <span className="font-semibold text-sm">{row.original.name}</span>
            )
          ) : row.original.url && !isVirtual ? (
            <CellLink
              href={row.original.url}
              maxWidth="max-w-[380px]"
              title={row.original.name}
              className={isVirtual ? "text-muted-foreground font-medium" : ""}
            >
              {row.original.name}
            </CellLink>
          ) : (
            <Truncate
              maxWidth="max-w-[380px]"
              title={row.original.name}
              className={isVirtual ? "text-muted-foreground font-medium" : ""}
            >
              {row.original.name}
            </Truncate>
          )}
          {canExpand && (
            <span className="ml-1 text-xs text-muted-foreground shrink-0">
              ({row.subRows.length})
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "list",
    size: 160,
    accessorFn: (row) => row.list.name,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent group"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        List
        <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity ${
          column.getIsSorted() ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`} />
      </Button>
    ),
    cell: ({ row }) => {
      if (row.original._isProjectGroup) return null;
      const task = row.original;
      const href = listUrl(task.team_id, task.list.id);
      return (
        <CellLink href={href} maxWidth="max-w-[140px]" title={task.list.name}>
          {task.list.name}
        </CellLink>
      );
    },
  },
  {
    accessorKey: "status",
    size: 130,
    accessorFn: (row) => row.status.status,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent group"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity ${
          column.getIsSorted() ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`} />
      </Button>
    ),
    cell: ({ row }) => {
      if (row.original._isProjectGroup) return null;
      const status = row.original.status;
      return (
        <Badge variant={getStatusColor(status.type)}>
          {status.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "creator",
    size: 140,
    accessorFn: (row) => row.creator.username || row.creator.email,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent group"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Assigned By
        <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity ${
          column.getIsSorted() ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`} />
      </Button>
    ),
    cell: ({ row }) => {
      if (row.original._isProjectGroup) return null;
      const creator = row.original.creator;
      const text = creator.username || creator.email || "-";
      return (
        <Truncate maxWidth="max-w-[120px]" title={text}>
          {text}
        </Truncate>
      );
    },
  },
  {
    accessorKey: "date_created",
    size: 110,
    accessorFn: (row) => (row.date_created ? parseInt(row.date_created) : 0),
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent group"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity ${
          column.getIsSorted() ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`} />
      </Button>
    ),
    cell: ({ row }) => {
      if (row.original._isProjectGroup) return null;
      const created = formatDate(row.original.date_created);
      return created || "-";
    },
  },
  {
    accessorKey: "due_date",
    size: 110,
    accessorFn: (row) => (row.due_date ? parseInt(row.due_date) : 0),
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent group"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Due Date
        <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity ${
          column.getIsSorted() ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`} />
      </Button>
    ),
    cell: ({ row }) => {
      if (row.original._isProjectGroup) return null;
      const dueDate = formatDate(row.original.due_date);
      return dueDate || "-";
    },
  },
  {
    id: "link",
    size: 70,
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      if (row.original._isProjectGroup) return null;
      return row.original.url ? (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm"
        >
          View →
        </a>
      ) : null;
    },
  },
];
