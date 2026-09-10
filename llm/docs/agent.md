# Agent

`llm/src/agent.ts` implements a tool-using agent, separate from the RAG pipeline. Where RAG retrieves static text to ground an answer, the agent takes actions: it calls Gemini's function-calling API in a loop, executing real tools and feeding their results back until the model produces a final answer with no more tool calls (capped at 6 turns to avoid infinite loops).

Three tools are registered: `list_products` and `get_product`, which call the real NestJS backend's `GET /products` and `GET /products/:id` endpoints directly over HTTP (so the backend must be running for the agent to work), and `sum`, a calculator the model is explicitly instructed to use for arithmetic instead of computing totals itself.

A key implementation detail: each function call the model makes carries a `thoughtSignature` field on its response `Part`, which must be preserved and echoed back unmodified on the next turn — reconstructing the function-call part manually (e.g. from the flattened `response.functionCalls` convenience array) drops this field and causes the API to reject the next request with a 400 error. The fix is to push `response.candidates[0].content` — the model's actual raw response content — onto the conversation history, rather than building a new `Content` object from scratch.
