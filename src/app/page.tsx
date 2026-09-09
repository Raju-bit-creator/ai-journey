type Stage = {
  title: string;
  items: string[];
  status: "done" | "current" | "next" | "upcoming";
};

const stages: Stage[] = [
  {
    title: "Frontend Developer",
    items: ["Next.js", "React", "TypeScript"],
    status: "done",
  },
  {
    title: "Backend",
    items: ["NestJS", "PostgreSQL", "Redis"],
    status: "current",
  },
  {
    title: "Python",
    items: ["FastAPI", "ML"],
    status: "next",
  },
  {
    title: "LLM Engineering",
    items: ["RAG", "Agents", "MCP"],
    status: "upcoming",
  },
  {
    title: "Production AI",
    items: ["Docker", "AWS", "Evaluation"],
    status: "upcoming",
  },
];

const statusStyles: Record<Stage["status"], string> = {
  done: "border-zinc-950/30 bg-white text-zinc-500 line-through decoration-zinc-400 dark:border-zinc-50/30 dark:bg-black dark:text-zinc-500",
  current:
    "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-black",
  next: "border-zinc-950/30 bg-white text-zinc-950 dark:border-zinc-50/30 dark:bg-black dark:text-zinc-50",
  upcoming:
    "border-black/[.08] bg-zinc-50 text-zinc-500 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-500",
};

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-24 sm:px-10">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Full-Stack AI Developer Roadmap
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
            You are here: Backend
          </h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Frontend is done. Next up is the backend stack — NestJS,
            PostgreSQL, and Redis — before moving on to Python and the AI
            stages that build toward a production system you deploy and
            evaluate.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {stages.map((stage, index) => (
            <li
              key={stage.title}
              className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition-colors ${statusStyles[stage.status]}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm font-semibold">
                {index + 1}
              </span>
              <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="font-semibold">{stage.title}</span>
                <span className="text-sm opacity-80">
                  {stage.items.join(" · ")}
                </span>
              </div>
              {stage.status === "current" && (
                <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
                  in progress
                </span>
              )}
              {stage.status === "done" && (
                <span className="shrink-0 text-xs font-medium">✓ done</span>
              )}
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-4 border-t border-black/[.08] pt-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/[.145]">
          <span>
            Edit{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-white/[.08]">
              src/app/page.tsx
            </code>{" "}
            to keep this roadmap up to date as you move through it.
          </span>
          <a
            className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js Docs →
          </a>
        </div>
      </main>
    </div>
  );
}
