import { deleteTask, updateTask } from "@/lib/tasks";

export async function PATCH(request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
  const task = updateTask(id, body);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json(task);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  if (!deleteTask(id)) return Response.json({ error: "Task not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
