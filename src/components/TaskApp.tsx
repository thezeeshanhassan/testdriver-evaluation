"use client";

import { useEffect, useRef, useState } from "react";
import type { Task } from "@/lib/tasks";
import { TITLE_MAX_LENGTH, validateTitle } from "@/lib/validation";

type Filter = "all" | "pending" | "completed";

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
  const visible = tasks.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-3 gap-3" aria-label="Task stats">
        <Stat label="Total" value={tasks.length} />
        <Stat label="Pending" value={tasks.length - completed} />
        <Stat label="Completed" value={completed} />
      </section>

      <form onSubmit={handleAdd} noValidate className="rounded-xl border border-gray-200 p-4">
        <label htmlFor="task-title" className="mb-2 block text-sm font-medium">
          Add a new task
        </label>
        <div className="flex gap-2">
          <input
            id="task-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="Task title"
            maxLength={TITLE_MAX_LENGTH + 20}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? "task-title-error" : undefined}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              titleError ? "border-red-500" : "border-gray-300"
            }`}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Adding…" : "+ Add Task"}
          </button>
        </div>
        {titleError && (
          <p id="task-title-error" role="alert" className="mt-2 text-sm text-red-600">
            {titleError}
          </p>
        )}
      </form>

      <section className="rounded-xl border border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Task list</h2>
          <div className="flex gap-1" role="group" aria-label="Filter tasks">
            {(["all", "pending", "completed"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`rounded-md px-2 py-1 text-xs capitalize ${
                  filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {loading ? (
          <p className="py-6 text-center text-sm text-gray-500" aria-live="polite">
            Loading tasks…
          </p>
        ) : loadError ? (
          <div className="py-6 text-center text-sm">
            <p role="alert" className="mb-2 text-red-600">{loadError}</p>
            <button onClick={loadTasks} className="text-indigo-600 hover:underline">
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            {tasks.length === 0 ? "No tasks yet. Add one above." : `No ${filter} tasks.`}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((task) => {
              const busy = busyIds.has(task.id);
              const editing = editingId === task.id;
              return (
                <li key={task.id} className="py-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      disabled={busy || editing}
                      onChange={() => toggle(task)}
                      aria-label={`Mark "${task.title}" as ${task.status === "completed" ? "pending" : "completed"}`}
                    />
                    {editing ? (
                      <input
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                          if (editError) setEditError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(task);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        aria-label="Edit task title"
                        aria-invalid={editError ? true : undefined}
                        className={`flex-1 rounded border px-2 py-1 text-sm ${
                          editError ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    ) : (
                      <span
                        className={`flex-1 text-sm ${task.status === "completed" ? "text-gray-400 line-through" : ""}`}
                      >
                        {task.title}
                      </span>
                    )}
                    <span className="text-xs capitalize text-gray-500">{task.status}</span>
                    {editing ? (
                      <>
                        <button
                          onClick={() => saveEdit(task)}
                          disabled={busy}
                          className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                        >
                          {busy ? "Saving…" : "Save"}
                        </button>
                        <button onClick={cancelEdit} disabled={busy} className="text-xs text-gray-600 hover:underline">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(task)}
                          disabled={busy}
                          className="text-xs text-gray-700 hover:underline disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(task)}
                          disabled={busy}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                  {editing && editError && (
                    <p role="alert" className="ml-7 mt-1 text-xs text-red-600">
                      {editError}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
