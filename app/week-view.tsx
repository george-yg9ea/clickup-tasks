"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClickUpTask } from "@/types/clickup";

const HOUR_MS = 3_600_000;
const DAY_CAPACITY_H = 5;
const PX_PER_HOUR = 52;
const MIN_CARD_PX = 72;

const PROJECT_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800" },
  { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-800" },
  { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800" },
  { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-800" },
  { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-800" },
  { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-800" },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-800" },
  { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-800" },
];

type Color = (typeof PROJECT_COLORS)[0];

// taskId → { [dateKey]: allocatedHours }
type Schedule = Record<string, Record<string, number>>;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function getWeekDays(offset = 0): Date[] {
  const today = new Date();
  const dow = today.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtH(h: number): string {
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
}

// ── HoursDialog ────────────────────────────────────────────────────────────

function HoursDialog({
  task,
  suggestedHours,
  onConfirm,
  onCancel,
}: {
  task: ClickUpTask;
  suggestedHours: number;
  onConfirm: (hours: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(String(suggestedHours));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseFloat(value);
    if (!isNaN(h) && h > 0) onConfirm(h);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onCancel}
    >
      <div
        className="bg-background rounded-lg border shadow-lg p-4 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium truncate mb-0.5">{task.name}</p>
        <p className="text-xs text-muted-foreground mb-3">How many hours today?</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="number"
            min="0.25"
            step="0.25"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
          <button
            type="submit"
            className="rounded bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium"
          >
            Place
          </button>
        </form>
      </div>
    </div>
  );
}

// ── TaskCard ───────────────────────────────────────────────────────────────

function TaskCard({
  task,
  color,
  isDragging,
  proportional = false,
  displayHours,
  onEditHours,
  maxHours,
  overAllocatedH,
  allocatedH,
  onDragStart,
  onDragEnd,
}: {
  task: ClickUpTask;
  color: Color;
  isDragging: boolean;
  proportional?: boolean;
  displayHours?: number;
  onEditHours?: (hours: number) => void;
  maxHours?: number;
  overAllocatedH?: number;
  allocatedH?: number;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const [liveHours, setLiveHours] = useState<number | null>(null);
  const resizeRef = useRef<{ startY: number; startHours: number; currentHours: number } | null>(null);

  const effectiveHours = liveHours ?? displayHours;
  const heightPx = proportional
    ? Math.max(MIN_CARD_PX, (effectiveHours ?? (task.time_estimate ? task.time_estimate / HOUR_MS : 0)) * PX_PER_HOUR)
    : undefined;

  const hoursLabel = effectiveHours !== undefined
    ? fmtH(effectiveHours)
    : task.time_estimate
    ? fmtH(task.time_estimate / HOUR_MS)
    : "No estimate";

  function onResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startHours = effectiveHours ?? (task.time_estimate ? task.time_estimate / HOUR_MS : 1);
    resizeRef.current = { startY: e.clientY, startHours, currentHours: startHours };
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(e: MouseEvent) {
      if (!resizeRef.current) return;
      const deltaH = (e.clientY - resizeRef.current.startY) / PX_PER_HOUR;
      const cap = maxHours ?? Infinity;
      const snapped = Math.min(cap, Math.max(0.25, Math.round((resizeRef.current.startHours + deltaH) * 4) / 4));
      resizeRef.current.currentHours = snapped;
      setLiveHours(snapped);
    }

    function onMouseUp() {
      const final = resizeRef.current?.currentHours;
      if (final !== undefined) onEditHours?.(final);
      resizeRef.current = null;
      setLiveHours(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={heightPx !== undefined ? { height: heightPx } : undefined}
      title={task.name}
      className={`
        relative rounded border px-3 py-2 cursor-grab active:cursor-grabbing select-none overflow-hidden shrink-0
        ${color.bg} ${color.border} ${color.text}
        ${isDragging ? "opacity-30" : ""}
        ${liveHours !== null ? "ring-2 ring-primary/40" : ""}
        transition-opacity
      `}
    >
      {task.url ? (
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium leading-tight line-clamp-2 hover:underline block"
          onClick={(e) => e.stopPropagation()}
        >
          {task.name}
        </a>
      ) : (
        <p className="text-xs font-medium leading-tight line-clamp-2">{task.name}</p>
      )}
      {task.project?.name ? (
        <p className="text-[10px] opacity-60 mt-0.5 truncate">{task.project.name}</p>
      ) : null}
      <p className="text-[10px] opacity-60 mt-0.5">{allocatedH !== undefined ? (task.time_estimate ? `${hoursLabel} estimated` : "No estimate") : hoursLabel}</p>
      {allocatedH !== undefined && allocatedH > 0 && (
        <p className={`text-[10px] mt-0.5 ${overAllocatedH && overAllocatedH > 0 ? "text-red-500 font-medium" : "opacity-60"}`}>
          {fmtH(allocatedH)} allocated
        </p>
      )}

      {onEditHours && (
        <div
          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-end justify-center pb-0.5"
          onMouseDown={onResizeMouseDown}
        >
          <div className="w-8 h-0.5 rounded-full bg-current opacity-20 group-hover:opacity-50 transition-opacity" />
        </div>
      )}
    </div>
  );
}

// ── DayCol ─────────────────────────────────────────────────────────────────

function DayCol({
  day, dayIndex, dateKey, dayTasks, totalH, isOver, draggingId, schedule,
  getColor, onDragOver, onDragLeave, onDrop, onTaskDragStart, onTaskDragEnd, onEditHours, onRemove,
}: {
  day: Date;
  dayIndex: number;
  dateKey: string;
  dayTasks: ClickUpTask[];
  totalH: number;
  isOver: boolean;
  draggingId: string | null;
  schedule: Schedule;
  getColor: (task: ClickUpTask) => Color;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onTaskDragStart: (taskId: string, source: string) => void;
  onTaskDragEnd: () => void;
  onEditHours: (taskId: string, dateKey: string, hours: number) => void;
  onRemove: (taskId: string, dateKey: string) => void;
}) {
  const isToday = toDateKey(new Date()) === dateKey;
  const pct = Math.min(100, (totalH / DAY_CAPACITY_H) * 100);
  const overloaded = totalH > DAY_CAPACITY_H;

  return (
    <div className="flex-1 flex flex-col gap-2" style={{ minWidth: 130 }}>
      <div className={`text-center pb-1 border-b ${isToday ? "border-primary" : ""}`}>
        <div className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>
          {DAY_LABELS[dayIndex]}
        </div>
        <div className="text-xs text-muted-foreground">
          {day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${overloaded ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`text-[10px] text-center leading-none ${overloaded ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
        {fmtH(totalH)} / {DAY_CAPACITY_H}h
      </div>

      <div
        className={`flex-1 rounded-lg border-2 border-dashed p-1.5 flex flex-col gap-1.5 overflow-y-auto transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-muted"
        }`}
        style={{ minHeight: 160 }}
        onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {dayTasks.map((t) => {
          const thisDayH = schedule[t.id]?.[dateKey] ?? 0;
          const maxH = undefined;
          return (
            <div key={t.id} className="relative group/card">
              <TaskCard
                task={t}
                color={getColor(t)}
                isDragging={draggingId === t.id}
                proportional
                displayHours={thisDayH}
                maxHours={maxH}
                onEditHours={(h) => onEditHours(t.id, dateKey, h)}
                onDragStart={() => onTaskDragStart(t.id, dateKey)}
                onDragEnd={onTaskDragEnd}
              />
              <button
                onClick={() => onRemove(t.id, dateKey)}
                className="absolute top-0.5 right-1 p-1.5 cursor-pointer opacity-0 group-hover/card:opacity-60 hover:!opacity-100 transition-opacity text-current"
                title="Remove from day"
              >
                <span className="text-[10px] leading-none">✕</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WeekView ───────────────────────────────────────────────────────────────

export function WeekView({ tasks }: { tasks: ClickUpTask[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [pendingDrop, setPendingDrop] = useState<{
    taskId: string;
    dateKey: string;
    suggestedHours: number;
  } | null>(null);
  const dragSourceRef = useRef<string>("inbox");

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((data) => {
        setSchedule(data ?? {});
        setScheduleLoaded(true);
      })
      .catch(() => setScheduleLoaded(true));
  }, []);

  function save(s: Schedule) {
    setSchedule(s);
    fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    }).catch(() => {});
  }

  const projectIds = [...new Set(tasks.map((t) => t.project?.id ?? "_none"))];
  const colorMap = new Map(
    projectIds.map((id, i) => [id, PROJECT_COLORS[i % PROJECT_COLORS.length]])
  );
  function getColor(task: ClickUpTask): Color {
    return colorMap.get(task.project?.id ?? "_none") ?? PROJECT_COLORS[0];
  }

  function totalAllocatedH(taskId: string): number {
    return Object.values(schedule[taskId] ?? {}).reduce((s, h) => s + h, 0);
  }

  function isFullyScheduled(_task: ClickUpTask): boolean {
    return false;
  }

  function remainingH(task: ClickUpTask): number {
    if (!task.time_estimate) return 0;
    return Math.max(0, task.time_estimate / HOUR_MS - totalAllocatedH(task.id));
  }

  const weekDays = getWeekDays(weekOffset);
  const inbox = tasks.filter((t) => !isFullyScheduled(t));

  useEffect(() => {
    const ids = [...new Set(inbox.map((t) => t.project?.id ?? "_none"))];
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => { if (!next.has(id)) next.add(id); });
      return next.size === prev.size ? prev : next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const inboxGroups: { projectId: string; projectName: string; tasks: ClickUpTask[] }[] = [];
  for (const task of inbox) {
    const projectId = task.project?.id ?? "_none";
    const projectName = task.project?.name ?? "No project";
    let group = inboxGroups.find((g) => g.projectId === projectId);
    if (!group) {
      group = { projectId, projectName, tasks: [] };
      inboxGroups.push(group);
    }
    group.tasks.push(task);
  }

  function tasksForDay(key: string) {
    return tasks.filter((t) => schedule[t.id]?.[key] !== undefined);
  }

  function totalHForDay(key: string): number {
    return tasks
      .filter((t) => schedule[t.id]?.[key] !== undefined)
      .reduce((sum, t) => sum + (schedule[t.id][key] ?? 0), 0);
  }

  function handleDragStart(taskId: string, source: string) {
    setDraggingId(taskId);
    dragSourceRef.current = source;
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOver(null);
  }

  function handleDrop(target: string) {
    if (!draggingId) return;
    const source = dragSourceRef.current;

    if (target === "inbox") {
      if (source !== "inbox") {
        const next = { ...schedule };
        const allocs = { ...(next[draggingId] ?? {}) };
        delete allocs[source];
        if (Object.keys(allocs).length === 0) delete next[draggingId];
        else next[draggingId] = allocs;
        save(next);
      }
      setDraggingId(null);
      setDragOver(null);
      return;
    }

    const task = tasks.find((t) => t.id === draggingId);
    if (!task) return;

    // Suggested = min(remaining after removing source alloc, available day capacity)
    const sourceAlloc = source !== "inbox" ? (schedule[task.id]?.[source] ?? 0) : 0;
    const remainingAfterMove = task.time_estimate
      ? Math.max(0.25, task.time_estimate / HOUR_MS - (totalAllocatedH(task.id) - sourceAlloc))
      : DAY_CAPACITY_H;
    const dayAvailH = Math.max(0.25, DAY_CAPACITY_H - totalHForDay(target));
    const suggested = parseFloat(Math.min(remainingAfterMove, dayAvailH).toFixed(2));

    setPendingDrop({ taskId: draggingId, dateKey: target, suggestedHours: suggested });
    setDraggingId(null);
    setDragOver(null);
  }

  function handleRemoveFromDay(taskId: string, dateKey: string) {
    const next = { ...schedule };
    const allocs = { ...(next[taskId] ?? {}) };
    delete allocs[dateKey];
    next[taskId] = allocs;
    save(next);
  }

  function handleEditHours(taskId: string, dateKey: string, hours: number) {
    const next = { ...schedule };
    next[taskId] = { ...(next[taskId] ?? {}), [dateKey]: hours };
    save(next);
  }

  function confirmDrop(hours: number) {
    if (!pendingDrop) return;
    const { taskId, dateKey } = pendingDrop;
    const source = dragSourceRef.current;
    const next = { ...schedule };

    if (source !== "inbox") {
      const allocs = { ...(next[taskId] ?? {}) };
      delete allocs[source];
      next[taskId] = allocs;
    }

    next[taskId] = { ...(next[taskId] ?? {}), [dateKey]: hours };
    save(next);
    setPendingDrop(null);
  }

  const pendingTask = pendingDrop ? tasks.find((t) => t.id === pendingDrop.taskId) : null;

  if (!scheduleLoaded) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading schedule…</div>;
  }

  return (
    <>
      {pendingDrop && pendingTask && (
        <HoursDialog
          task={pendingTask}
          suggestedHours={pendingDrop.suggestedHours}
          onConfirm={confirmDrop}
          onCancel={() => setPendingDrop(null)}
        />
      )}

      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[160px] text-center">
          {weekOffset === 0
            ? "This week"
            : weekOffset === 1
            ? "Next week"
            : weekOffset === -1
            ? "Last week"
            : `${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDays[4].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {weekOffset !== 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs ml-1" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto" style={{ height: "calc(100vh - 260px)" }}>
        {/* Inbox */}
        <div className="flex-1 flex flex-col gap-2 bg-muted/40 rounded-lg px-2 py-1" style={{ minWidth: 130 }}>
          <div className="flex items-center pb-1 border-b h-10 gap-1">
            <div className="text-sm font-semibold flex-1">
              Inbox{" "}
              <span className="text-muted-foreground font-normal">({inbox.length})</span>
            </div>
            <button
              onClick={() => {
                const allIds = inboxGroups.map((g) => g.projectId);
                const allCollapsed = allIds.every((id) => collapsedGroups.has(id));
                setCollapsedGroups(allCollapsed ? new Set() : new Set(allIds));
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={inboxGroups.every((g) => collapsedGroups.has(g.projectId)) ? "Expand all" : "Collapse all"}
            >
              {inboxGroups.every((g) => collapsedGroups.has(g.projectId))
                ? <ChevronsUpDown className="h-3.5 w-3.5" />
                : <ChevronsDownUp className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div
            className={`flex-1 rounded-lg border-2 border-dashed p-1.5 flex flex-col gap-1.5 overflow-y-auto transition-colors ${
              dragOver === "inbox" ? "border-primary bg-primary/5" : "border-muted"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver("inbox"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop("inbox")}
          >
            {inbox.length === 0 && (
              <p className="text-xs text-muted-foreground text-center pt-6">All placed ✓</p>
            )}
            {inboxGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.projectId);
              return (
                <div key={group.projectId} className="flex flex-col rounded-lg border bg-card">
                  <button
                    onClick={() => setCollapsedGroups((prev) => {
                      const next = new Set(prev);
                      if (next.has(group.projectId)) next.delete(group.projectId);
                      else next.add(group.projectId);
                      return next;
                    })}
                    className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <ChevronRight className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${isCollapsed ? "" : "rotate-90"}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate flex-1">
                      {group.projectName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{group.tasks.length}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="flex flex-col gap-1 px-1.5 pb-1.5">
                      {group.tasks.map((t) => {
                        const estimateH = t.time_estimate ? t.time_estimate / HOUR_MS : undefined;
                        const allocatedH = totalAllocatedH(t.id);
                        const overH = estimateH !== undefined ? Math.max(0, allocatedH - estimateH) : 0;
                        const rem = remainingH(t);
                        const displayHours = estimateH;
                        return (
                          <TaskCard
                            key={t.id}
                            task={t}
                            color={getColor(t)}
                            isDragging={draggingId === t.id}
                            displayHours={displayHours}
                            overAllocatedH={overH}
                            allocatedH={allocatedH}
                            onDragStart={() => handleDragStart(t.id, "inbox")}
                            onDragEnd={handleDragEnd}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day columns */}
        {weekDays.map((day, i) => {
          const key = toDateKey(day);
          return (
            <DayCol
              key={key}
              day={day}
              dayIndex={i}
              dateKey={key}
              dayTasks={tasksForDay(key)}
              totalH={totalHForDay(key)}
              isOver={dragOver === key}
              draggingId={draggingId}
              schedule={schedule}
              getColor={getColor}
              onDragOver={() => setDragOver(key)}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(key)}
              onTaskDragStart={handleDragStart}
              onTaskDragEnd={handleDragEnd}
              onEditHours={handleEditHours}
              onRemove={handleRemoveFromDay}
            />
          );
        })}
      </div>
    </>
  );
}
