"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/tasks";

type Filter = "all" | "pending" | "completed";

export default function TaskApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then(setTasks);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const task: Task = await res.json();
    setTasks((prev) => [...prev, task]);
    setTitle("");
  }

  async function toggle(task: Task) {
    const status = task.status === "completed" ? "pending" : "completed";
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated: Task = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function remove(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
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

      <form onSubmit={handleAdd} className="rounded-xl border border-gray-200 p-4">
        <label htmlFor="task-title" className="mb-2 block text-sm font-medium">
          Add a new task
        </label>
        <div className="flex gap-2">
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
            + Add Task
          </button>
        </div>
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
        <ul className="divide-y divide-gray-100">
          {visible.map((task) => (
            <li key={task.id} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={task.status === "completed"}
                onChange={() => toggle(task)}
                aria-label={`Mark "${task.title}" as ${task.status === "completed" ? "pending" : "completed"}`}
              />
              <span className={`flex-1 text-sm ${task.status === "completed" ? "text-gray-400 line-through" : ""}`}>
                {task.title}
              </span>
              <span className="text-xs capitalize text-gray-500">{task.status}</span>
              <button onClick={() => remove(task.id)} className="text-xs text-red-600 hover:underline">
                Delete
              </button>
            </li>
          ))}
        </ul>
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
