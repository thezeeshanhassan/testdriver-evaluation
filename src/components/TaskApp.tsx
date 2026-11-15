"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  ListTodo,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import type { Task } from "@/lib/tasks";
import { TITLE_MAX_LENGTH, validateTitle } from "@/lib/validation";
import Sidebar, { Logo } from "./Sidebar";
import ThemeToggle from "./ThemeToggle";

type Filter = "all" | "pending" | "completed";
type Sort = "newest" | "oldest" | "az";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "Added just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Added ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Added ${hours}h ago`;
  return `Added ${Math.round(hours / 24)}d ago`;
}

export default function TaskApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  async function loadTasks() {
    setLoading(true);
    setLoadError(null);
    try {
      setTasks(await request<Task[]>("/api/tasks"));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    loadTasks();
  }, []);

  function setBusy(id: string, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    // Ref guard blocks a second submit fired before React re-renders the
    // disabled button (e.g. a fast double-click or Enter + click).
    if (submittingRef.current) return;

    const error = validateTitle(title, tasks.map((t) => t.title));
    setTitleError(error);
    if (error) return;

    submittingRef.current = true;
    setSubmitting(true);
    setActionError(null);
    try {
      const task = await request<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: title.trim() }),
      });
      setTasks((prev) => [...prev, task]);
      setTitle("");
    } catch (err) {
      setTitleError(err instanceof Error ? err.message : "Could not add task.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function toggle(task: Task) {
    const status = task.status === "completed" ? "pending" : "completed";
    setBusy(task.id, true);
    setActionError(null);
    try {
      const updated = await request<Task>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update task.");
    } finally {
      setBusy(task.id, false);
    }
  }

  async function remove(task: Task) {
    setBusy(task.id, true);
    setActionError(null);
    try {
      await request<void>(`/api/tasks/${task.id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete task.");
    } finally {
      setBusy(task.id, false);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(task: Task) {
    const others = tasks.filter((t) => t.id !== task.id).map((t) => t.title);
    const error = validateTitle(editTitle, others);
    setEditError(error);
    if (error) return;

    setBusy(task.id, true);
    try {
      const updated = await request<Task>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Could not save task.");
    } finally {
      setBusy(task.id, false);
    }
  }

  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.length - completed;
  const counts: Record<Filter, number> = { all: tasks.length, pending, completed };

  const q = query.trim().toLowerCase();
  const visible = tasks
    .filter((t) => filter === "all" || t.status === filter)
    .filter((t) => !q || t.title.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "oldest" ? diff : -diff;
    });

  return (
    <div className="mx-auto flex max-w-7xl gap-6 p-4">
      <Sidebar completed={completed} total={tasks.length} />

      <main className="min-w-0 flex-1 py-2 lg:px-4">
        {/* Mobile header */}
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <Logo />
          <ThemeToggle />
        </div>

        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Welcome back</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
              My <span className="text-accent">Tasks</span>
            </h1>
            <p className="mt-2 text-muted">Organize your work, get things done.</p>
          </div>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Task stats">
          <StatCard label="Total Tasks" value={tasks.length} total={tasks.length} tone="ink" Icon={ListTodo} />
          <StatCard label="Pending" value={pending} total={tasks.length} tone="warn" Icon={Clock} />
          <StatCard label="Completed" value={completed} total={tasks.length} tone="accent" Icon={CircleCheck} />
        </section>

        <form
          onSubmit={handleAdd}
          noValidate
          className="mt-6 rounded-2xl border border-accent/40 bg-surface p-5 shadow-[0_0_40px_var(--glow)]"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-ink">
              <Plus className="size-5" aria-hidden />
            </span>
            <div>
              <label htmlFor="task-title" className="block font-semibold">
                Add a new task
              </label>
              <p className="text-sm text-muted">3–{TITLE_MAX_LENGTH} characters, no duplicates.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder="e.g. Build authentication system"
              maxLength={TITLE_MAX_LENGTH + 20}
              aria-invalid={titleError ? true : undefined}
              aria-describedby={titleError ? "task-title-error" : undefined}
              className={`h-11 flex-1 rounded-xl border bg-surface-2 px-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 ${
                titleError ? "border-danger" : "border-line"
              }`}
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-ink transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <SendHorizontal className="size-4" aria-hidden />
              )}
              {submitting ? "Adding…" : "Add Task"}
            </button>
          </div>
          {titleError && (
            <p id="task-title-error" role="alert" className="mt-2 text-sm text-danger">
              {titleError}
            </p>
          )}
        </form>

        <section className="mt-8" aria-labelledby="task-list-heading">
          <h2 id="task-list-heading" className="sr-only">
            Task list
          </h2>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tasks">
              {(["all", "pending", "completed"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm capitalize transition-colors ${
                    filter === f
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line bg-surface text-ink hover:border-accent/50"
                  }`}
                >
                  {f}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      filter === f ? "bg-accent-ink/15" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {counts[f]}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1 lg:w-64 lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks…"
                  aria-label="Search tasks"
                  className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="Sort tasks"
                className="h-10 rounded-full border border-line bg-surface px-4 text-sm outline-none focus:border-accent"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="az">A–Z</option>
              </select>
            </div>
          </div>

          {actionError && (
            <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {actionError}
            </p>
          )}

          <div className="mt-4">
            {loading ? (
              <ul className="space-y-2" aria-label="Loading tasks">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="h-16 animate-pulse rounded-xl border border-line bg-surface" />
                ))}
                <li className="sr-only" aria-live="polite">
                  Loading tasks…
                </li>
              </ul>
            ) : loadError ? (
              <div className="rounded-xl border border-line bg-surface py-10 text-center text-sm">
                <p role="alert" className="mb-3 text-danger">
                  {loadError}
                </p>
                <button type="button" onClick={loadTasks} className="font-medium text-accent hover:underline">
                  Try again
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-muted">
                {tasks.length === 0
                  ? "No tasks yet. Add one above."
                  : q
                    ? `No tasks match “${query.trim()}”.`
                    : `No ${filter} tasks.`}
              </div>
            ) : (
              <ul className="space-y-2">
                {visible.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    busy={busyIds.has(task.id)}
                    editing={editingId === task.id}
                    editTitle={editTitle}
                    editError={editError}
                    onEditTitle={(v) => {
                      setEditTitle(v);
                      if (editError) setEditError(null);
                    }}
                    onToggle={() => toggle(task)}
                    onStartEdit={() => startEdit(task)}
                    onSave={() => saveEdit(task)}
                    onCancel={cancelEdit}
                    onDelete={() => remove(task)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const tones = {
  ink: { icon: "bg-surface-2 text-ink", bar: "bg-ink/70" },
  warn: { icon: "bg-warn-soft text-warn", bar: "bg-warn" },
  accent: { icon: "bg-accent-soft text-accent", bar: "bg-accent" },
};

function StatCard({
  label,
  value,
  total,
  tone,
  Icon,
}: {
  label: string;
  value: number;
  total: number;
  tone: keyof typeof tones;
  Icon: typeof Clock;
}) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-4">
        <span className={`grid size-12 place-items-center rounded-full ${tones[tone].icon}`}>
          <Icon className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-3xl font-bold tabular-nums">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className={`h-full rounded-full transition-[width] duration-500 ${tones[tone].bar}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function TaskRow({
  task,
  busy,
  editing,
  editTitle,
  editError,
  onEditTitle,
  onToggle,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  task: Task;
  busy: boolean;
  editing: boolean;
  editTitle: string;
  editError: string | null;
  onEditTitle: (value: string) => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const done = task.status === "completed";
  const iconButton =
    "grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors disabled:opacity-50";

  return (
    <li
      className={`rounded-xl border bg-surface px-4 py-3 transition-colors ${
        editing ? "border-accent/60" : "border-line hover:border-accent/30"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <label className="relative grid size-6 shrink-0 cursor-pointer place-items-center">
          <input
            type="checkbox"
            checked={done}
            disabled={busy || editing}
            onChange={onToggle}
            aria-label={`Mark "${task.title}" as ${done ? "pending" : "completed"}`}
            className="peer size-6 cursor-pointer appearance-none rounded-md border-2 border-line bg-surface-2 transition-colors checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed"
          />
          <Check
            className="pointer-events-none absolute size-4 text-accent-ink opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden
          />
        </label>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              value={editTitle}
              onChange={(e) => onEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancel();
              }}
              autoFocus
              aria-label="Edit task title"
              aria-invalid={editError ? true : undefined}
              className={`h-9 w-full rounded-lg border bg-surface-2 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                editError ? "border-danger" : "border-line focus:border-accent"
              }`}
            />
          ) : (
            <p className={`truncate ${done ? "text-muted line-through" : ""}`}>{task.title}</p>
          )}
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            {timeAgo(task.createdAt)}
          </p>
        </div>

        <span
          className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${
            done ? "bg-accent-soft text-accent" : "bg-warn-soft text-warn"
          }`}
        >
          {done ? <CircleCheck className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
          {done ? "Completed" : "Pending"}
        </span>

        {editing ? (
          <>
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              aria-label="Save"
              className={`${iconButton} hover:border-accent hover:text-accent`}
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              aria-label="Cancel"
              className={`${iconButton} hover:text-ink`}
            >
              <X className="size-4" aria-hidden />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onStartEdit}
              disabled={busy}
              aria-label={`Edit "${task.title}"`}
              title="Edit"
              className={`${iconButton} hover:border-accent hover:text-accent`}
            >
              <Pencil className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              aria-label={`Delete "${task.title}"`}
              title="Delete"
              className={`${iconButton} hover:border-danger hover:bg-danger-soft hover:text-danger`}
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
            </button>
          </>
        )}
      </div>
      {editing && editError && (
        <p role="alert" className="ml-10 mt-1.5 text-xs text-danger">
          {editError}
        </p>
      )}
    </li>
  );
}
