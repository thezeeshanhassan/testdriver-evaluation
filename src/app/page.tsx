import TaskApp from "@/components/TaskApp";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-600">TaskFlow</p>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
      </header>
      <TaskApp />
    </main>
  );
}
