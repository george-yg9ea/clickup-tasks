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

function listUrl(teamId: string, listId: string): string {
  return `https://app.clickup.com/${teamId}/v/li/${listId}`;
}

function folderUrl(teamId: string, folderId: string, spaceId: string): string {
  return `https://app.clickup.com/${teamId}/v/f/${folderId}/${spaceId}`;
}

function sortableHeader(label: string) {
  return ({ column }: { column: { toggleSorting: (asc: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-transparent group"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className={`ml-2 h-4 w-4 transition-opacity ${
        column.getIsSorted() ? "opacity-100" : "opacity-0 group-hover:opacity-50"
      }`} />
    </Button>
  );
}

// ── Shared columns ──────────────────────────────────────────────

const listColumn: ColumnDef<ClickUpTask> = {
  accessorKey: "list",
  size: 160,
  accessorFn: (row) => row.list.name,
  header: sortableHeader("List"),
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
};

const statusColumn: ColumnDef<ClickUpTask> = {
  accessorKey: "status",
  size: 130,
  accessorFn: (row) => row.status.status,
  header: sortableHeader("Status"),
  cell: ({ row }) => {
    if (row.original._isProjectGroup) return null;
    const status = row.original.status;
    return (
      <Badge variant={getStatusColor(status.type)}>
        {status.status}
      </Badge>
    );
  },
};

const creatorColumn: ColumnDef<ClickUpTask> = {
  accessorKey: "creator",
  size: 140,
  accessorFn: (row) => row.creator.username || row.creator.email,
  header: sortableHeader("Assigned By"),
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
};

const dateCreatedColumn: ColumnDef<ClickUpTask> = {
  accessorKey: "date_created",
  size: 110,
  accessorFn: (row) => (row.date_created ? parseInt(row.date_created) : 0),
  header: sortableHeader("Created"),
  cell: ({ row }) => {
    if (row.original._isProjectGroup) return null;
    return formatDate(row.original.date_created) || "-";
  },
};

const dueDateColumn: ColumnDef<ClickUpTask> = {
  accessorKey: "due_date",
  size: 110,
  accessorFn: (row) => (row.due_date ? parseInt(row.due_date) : 0),
  header: sortableHeader("Due Date"),
  cell: ({ row }) => {
    if (row.original._isProjectGroup) return null;
    return formatDate(row.original.due_date) || "-";
  },
};

const linkColumn: ColumnDef<ClickUpTask> = {
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
};

// ── Expand/chevron cell helper ──────────────────────────────────

function ExpandableTaskCell({ row }: { row: { getCanExpand: () => boolean; getToggleExpandedHandler: () => () => void; getIsExpanded: () => boolean; depth: number; original: ClickUpTask; subRows: unknown[] } }) {
  const canExpand = row.getCanExpand();
  const isProjectGroup = row.original._isProjectGroup;
  const isVirtual = row.original._isVirtualParent;

  const depthOffset = isProjectGroup ? 0 : row.depth * 24;

  return (
    <div
      className="flex items-center gap-1"
      style={{ paddingLeft: `${Math.max(0, depthOffset)}px` }}
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
          <CellLink href={row.original.url} maxWidth="max-w-[400px]" title={row.original.name} className="font-semibold text-sm">
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
}

// ── "Group by Project" columns ──────────────────────────────────

export const groupedColumns: ColumnDef<ClickUpTask>[] = [
  {
    accessorKey: "name",
    header: sortableHeader("Task"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cell: ({ row }) => <ExpandableTaskCell row={row as any} />,
  },
  listColumn,
  statusColumn,
  creatorColumn,
  dateCreatedColumn,
  dueDateColumn,
  linkColumn,
];

// ── "All Tasks" flat columns ────────────────────────────────────

const projectColumn: ColumnDef<ClickUpTask> = {
  accessorKey: "project",
  size: 160,
  accessorFn: (row) => row.project?.name ?? "",
  header: sortableHeader("Project"),
  cell: ({ row }) => {
    const task = row.original;
    const name = task.project?.name;
    const href = name && task.folder?.id && task.space?.id
      ? folderUrl(task.team_id, task.folder.id, task.space.id)
      : null;
    return name ? (
      href ? (
        <CellLink href={href} maxWidth="max-w-[140px]" title={name} className="text-sm">
          {name}
        </CellLink>
      ) : (
        <Truncate maxWidth="max-w-[140px]" title={name} className="text-sm">
          {name}
        </Truncate>
      )
    ) : (
      <span className="text-muted-foreground/50">—</span>
    );
  },
};

export const flatColumns: ColumnDef<ClickUpTask>[] = [
  projectColumn,
  {
    ...listColumn,
    cell: ({ row }) => {
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
    accessorKey: "name",
    header: sortableHeader("Task"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cell: ({ row }) => <ExpandableTaskCell row={row as any} />,
  },
  {
    ...statusColumn,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={getStatusColor(status.type)}>
          {status.status}
        </Badge>
      );
    },
  },
  {
    ...creatorColumn,
    cell: ({ row }) => {
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
    ...dateCreatedColumn,
    cell: ({ row }) => formatDate(row.original.date_created) || "-",
  },
  {
    ...dueDateColumn,
    cell: ({ row }) => formatDate(row.original.due_date) || "-",
  },
  {
    ...linkColumn,
    cell: ({ row }) => row.original.url ? (
      <a href={row.original.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
        View →
      </a>
    ) : null,
  },
];
