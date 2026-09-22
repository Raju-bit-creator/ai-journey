"use client";

import { useActionState, useRef, useEffect } from "react";
import { sendMessage, type ChatMessage } from "./actions";

const initialMessages: ChatMessage[] = [];

export default function Chat() {
  const [messages, formAction, pending] = useActionState(sendMessage, initialMessages);
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) formRef.current?.reset();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pending, messages]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ask about how this project is built — e.g. &ldquo;why does the backend use Vitest instead of
            Jest?&rdquo;
          </p>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 ${message.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
                message.role === "user"
                  ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-black"
                  : "bg-zinc-100 text-black dark:bg-zinc-900 dark:text-zinc-50"
              }`}
            >
              {message.text}
            </div>
            {message.sources && message.sources.length > 0 && (
              <details className="max-w-[85%] text-xs text-zinc-500 dark:text-zinc-400">
                <summary className="cursor-pointer select-none">
                  {message.sources.length} source{message.sources.length > 1 ? "s" : ""} retrieved
                </summary>
                <ul className="mt-1 flex flex-col gap-1 pl-3">
                  {message.sources.map((source, j) => (
                    <li key={j}>
                      [{j + 1}] <span className="font-mono">{source.source}</span> (score{" "}
                      {source.score.toFixed(3)})
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}

        {pending && (
          <div className="flex items-start">
            <div className="rounded-xl bg-zinc-100 px-4 py-2 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form ref={formRef} action={formAction} className="flex gap-2">
        <input
          name="message"
          type="text"
          placeholder="Ask how this project works…"
          disabled={pending}
          required
          className="flex-1 rounded-md border border-black/[.08] bg-white px-3 py-2 text-sm dark:border-white/[.145] dark:bg-black"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-zinc-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Send
        </button>
      </form>
    </div>
  );
}
