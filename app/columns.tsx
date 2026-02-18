"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { ClickUpTask } from "@/types/clickup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusColor } from "@/lib/task-utils";

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
  },
  {
    accessorKey: "status",
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
      const status = row.original.status;
      return (
        <Badge variant={getStatusColor(status.type)}>
          {status.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "list",
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
    cell: ({ row }) => row.original.list.name,
  },
  {
    accessorKey: "creator",
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
      const creator = row.original.creator;
      return creator.username || creator.email || "-";
    },
  },
  {
    accessorKey: "date_created",
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
      const created = formatDate(row.original.date_created);
      return created || "-";
    },
  },
  {
    accessorKey: "due_date",
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
      const dueDate = formatDate(row.original.due_date);
      return dueDate || "-";
    },
  },
  {
    id: "link",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
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
