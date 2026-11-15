import { deleteTask, getTasks, updateTask, type TaskStatus } from "@/lib/tasks";
import { validateTitle } from "@/lib/validation";

const STATUSES: TaskStatus[] = ["pending", "completed"];

export async function PATCH(request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;

  let body: { title?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const patch: { title?: string; status?: TaskStatus } = {};

  if (body.title !== undefined) {
    const others = getTasks().filter((t) => t.id !== id).map((t) => t.title);
    const error = validateTitle(body.title, others);
    if (error) return Response.json({ error }, { status: 400 });
    patch.title = (body.title as string).trim();
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as TaskStatus)) {
      return Response.json({ error: "Status must be pending or completed." }, { status: 400 });
    }
    patch.status = body.status as TaskStatus;
  }

  const task = updateTask(id, patch);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json(task);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  if (!deleteTask(id)) return Response.json({ error: "Task not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
