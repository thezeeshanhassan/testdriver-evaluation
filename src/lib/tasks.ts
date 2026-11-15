export type TaskStatus = "pending" | "completed";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
}

// In-memory store. Resets whenever the dev server restarts, which is fine for
// an evaluation app: every run starts from the same seed data.
const globalStore = globalThis as unknown as { __tasks?: Task[] };

function seed(): Task[] {
  const now = Date.now();
  return [
    { id: "1", title: "Build authentication", status: "completed", createdAt: new Date(now - 3e5).toISOString() },
    { id: "2", title: "Improve dashboard", status: "pending", createdAt: new Date(now - 2e5).toISOString() },
    { id: "3", title: "Add task filters", status: "pending", createdAt: new Date(now - 1e5).toISOString() },
  ];
}

export function getTasks(): Task[] {
  if (!globalStore.__tasks) globalStore.__tasks = seed();
  return globalStore.__tasks;
}

export function addTask(title: string): Task {
  const task: Task = {
    id: crypto.randomUUID(),
    title,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  getTasks().push(task);
  return task;
}

export function updateTask(id: string, patch: Partial<Pick<Task, "title" | "status">>): Task | null {
  const task = getTasks().find((t) => t.id === id);
  if (!task) return null;
  Object.assign(task, patch);
  return task;
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
}
