import { addTask, getTasks } from "@/lib/tasks";

export async function GET() {
  return Response.json(getTasks());
}

export async function POST(request: Request) {
  const body = await request.json();
  const task = addTask(body.title);
  return Response.json(task, { status: 201 });
}
