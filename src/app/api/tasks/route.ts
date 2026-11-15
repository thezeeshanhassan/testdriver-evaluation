import { addTask, getTasks } from "@/lib/tasks";
import { validateTitle } from "@/lib/validation";

export async function GET() {
  return Response.json(getTasks());
}

export async function POST(request: Request) {
  let body: { title?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const error = validateTitle(body.title, getTasks().map((t) => t.title));
  if (error) return Response.json({ error }, { status: 400 });

  const task = addTask((body.title as string).trim());
  return Response.json(task, { status: 201 });
}
