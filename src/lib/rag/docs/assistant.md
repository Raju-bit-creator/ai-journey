# The /assistant page

`/assistant` is a chat page in the Next.js app backed by the agent in `src/lib/agent/`. It's a real, live feature — not a demo — reachable at `http://localhost:3000/assistant` when the app is running.

The chat UI (`src/app/assistant/chat.tsx`) uses React's `useActionState`, where the "state" is the growing list of chat messages itself: the Server Action (`sendMessage` in `src/app/assistant/actions.ts`) appends both the user's question and the assistant's answer to the array on every call, rather than replacing a single value. Each tool call the agent makes during a turn is shown in a collapsible "N tool calls" disclosure under the relevant message, so you can see exactly what it did to answer.

The assistant has four tools available: `list_products` and `get_product` (call the NestJS backend), `sum` (local arithmetic), and `classify_iris` (calls the Python FastAPI service's `/predict` endpoint to run the real trained model). It is read-only — there is no tool for creating, editing, or deleting products, and the system prompt explicitly tells it to say so plainly if asked, rather than pretending it did something it can't.

A separate, sibling feature exists for retrieval — a RAG pipeline under `src/lib/rag/`, ported from the same source as the standalone `llm/` project's RAG pipeline, answering questions from this same set of documentation files rather than by calling live tools. The two are architecturally distinct: the agent *acts* (calls tools, gets live data), RAG *retrieves* (finds the most relevant pre-written text and grounds an answer in it). A single question could in principle be answered by either, but they are not currently combined into one chat interface.
