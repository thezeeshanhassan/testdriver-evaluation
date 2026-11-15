import { ChartColumn, House, Rocket, Settings, SquareCheckBig } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-ink shadow-[0_0_24px_var(--glow)]">
        <SquareCheckBig className="size-5" aria-hidden />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Task<span className="text-accent">Flow</span>
      </span>
    </div>
  );
}

const nav = [
  { label: "My Tasks", Icon: House, active: true },
  { label: "Analytics", Icon: ChartColumn, active: false },
  { label: "Settings", Icon: Settings, active: false },
];

export default function Sidebar({ completed, total }: { completed: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-2xl border border-line bg-surface p-4 lg:flex">
      <div className="px-2 pt-1">
        <Logo />
      </div>

      <nav aria-label="Main" className="mt-8 space-y-1">
        {nav.map(({ label, Icon, active }) =>
          active ? (
            <a
              key={label}
              href="#"
              aria-current="page"
              className="flex items-center gap-3 rounded-xl bg-accent-soft px-3 py-2.5 text-sm font-medium text-accent"
            >
              <Icon className="size-4.5" aria-hidden />
              {label}
            </a>
          ) : (
            <span
              key={label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted"
            >
              <Icon className="size-4.5" aria-hidden />
              {label}
              <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                Soon
              </span>
            </span>
          ),
        )}
      </nav>

      <div className="mt-auto rounded-xl border border-line bg-surface-2 p-4 text-center">
        <Rocket className="mx-auto size-7 text-accent" aria-hidden />
        <p className="mt-2 text-sm font-semibold">
          {percent === 100 && total > 0 ? "All done!" : "Stay productive!"}
        </p>
        <p className="text-xs text-muted">
          {completed} of {total} tasks completed
        </p>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Completion"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-1">
        <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
          ZH
        </span>
        <span className="text-sm font-medium">Zeeshan Hassan</span>
      </div>
    </aside>
  );
}
