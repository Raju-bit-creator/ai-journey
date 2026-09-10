# LLM Engineering stage — RAG + Agents

A standalone TypeScript project. Two pieces so far: a RAG pipeline answering questions about *this actual codebase* (grounded in real docs, not generic sample data), and an agent that autonomously uses tools — including calling the real NestJS Products API — to answer questions requiring multi-step reasoning.

## How it works

1. **Retrieval is local, no API key needed.** `llm/docs/*.md` gets split into paragraph-sized chunks and embedded with a small local model (`@huggingface/transformers`, running `Xenova/all-MiniLM-L6-v2` entirely on-device — first run downloads the model, ~90MB, then it's cached).
2. **Generation calls Gemini.** The top-matching chunks (by cosine similarity) get stuffed into a prompt along with the question, and `gemini-3.6-flash` generates an answer, citing which excerpt(s) it used.

## Setup

```bash
cd llm
npm install
```

Add a free Gemini API key (from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)) to `.env`:

```
GEMINI_API_KEY=...
```

## Usage

```bash
npm run ingest              # builds vector-store.json from docs/ (rerun after editing docs)
npm run ask -- "your question"
```

Example:

```bash
npm run ask -- "How does authentication work in this project?"
```

Prints the answer with `[1]`, `[2]` citations, plus the raw retrieved chunks and their similarity scores underneath, so you can see exactly what grounded the answer.

## Agent

```bash
npm run agent -- "your question"
```

Needs the NestJS backend running (`cd ../backend && npm run start:dev`, plus its Docker containers) — the agent's tools call `http://localhost:3001` directly. Three tools: `list_products`, `get_product`, and `sum` (a calculator — the model is instructed to use it instead of doing arithmetic itself). The CLI prints every tool call made (name, args, result) before the final answer, so you can see the reasoning trace.

Example:

```bash
npm run agent -- "What is the total value of everything in the catalog, and which item is most expensive?"
```

## Notes

- Originally built against the Claude API; switched to Gemini for its free tier. Swapping back means rewriting `src/rag.ts`'s `generateContent` call — the retrieval half (`embeddings.ts`, `chunk.ts`, `store.ts`, `ingest.ts`) is provider-agnostic and doesn't change.
- `@huggingface/transformers` pulls in `sharp`/`onnxruntime-node`, which currently have unfixed high-severity advisories in image/zip handling (`npm audit`). Not exploitable here — this is a local script processing our own markdown, not untrusted uploads — but worth knowing if this pattern gets reused somewhere that does handle untrusted input.
