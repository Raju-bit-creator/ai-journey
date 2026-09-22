import Link from "next/link";
import Chat from "./chat";

export default function AssistantPage() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-24 sm:px-10">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            LLM Engineering · Agent
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
            Assistant
          </h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            A tool-using agent that can look up the{" "}
            <Link href="/products" className="font-medium text-zinc-950 hover:underline dark:text-zinc-50">
              product catalog
            </Link>{" "}
            and do arithmetic. Read-only for now — it can&apos;t create, edit, or delete anything.
          </p>
        </div>

        <Chat />
      </main>
    </div>
  );
}
