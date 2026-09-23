---
name: code-review
description: Use when reviewing a diff, branch, PR, or your own changes before finishing — for any part of this repo (Next.js frontend, NestJS backend, FastAPI, llm sandbox). Provides the review procedure, a repo-specific checklist, and the required findings format.
---

# Code review

## Procedure

1. **See what changed:** `git status` and `git diff` (plus `git diff --staged`). Untracked files count — read them too.
2. **Read the changed code in full context**, not just hunks — open the surrounding function/file.
3. **Run the checks** for each touched project (see `AGENTS.md` → Commands). Don't review from the diff alone if you can run it.
4. Walk the checklist below. Report only findings you can point to with evidence.

## Checklist (repo-specific)

**Secrets**
- No `.env*` content, API keys, or session ids in the diff, docs, tests, or README. Real keys live in `.env.local` and `llm/.env`. Scan the diff for `AQ.`, `sk-`, `AIza`.

**Authorization & data safety**
- Every write endpoint has `SessionAuthGuard`, and ownership is enforced **in the service** (`assertOwnership`), not only by hiding UI.
- Server Actions check auth inside the action — they're public endpoints.
- DTOs validate all input; `passwordHash` is never selected/returned; no string-built SQL (TypeORM query builders must use parameters).
- LLM tool arguments are **untrusted model output**: validated, and `encodeURIComponent`'d before going into a URL path.

**Correctness**
- Cache coherence: any new write path calls `invalidateCache()`; any new cached read is invalidated by all relevant writes.
- Schema: entity changes auto-apply (no migrations). Is a NOT NULL column being added to a populated table? Anything destructive?
- Nest ESM: relative imports end in `.js`; new modules are registered in `AppModule`.
- Next.js: `params`/`searchParams`/`cookies()` awaited; `redirect()` is last and outside try/catch; `'use client'` only where needed; server-only env vars have no `NEXT_PUBLIC_`; JSX apostrophes escaped.
- Gemini: `models.generateContent` (never `interactions`); function-call turns push the raw `candidates[0].content`; 429/503 handled with a graceful fallback.
- Env/ports: new variables added to the right `.env.example`; no new use of default ports 5432/6379; nothing that assumes the local-dev and full-Docker stacks run together.

**Tests & docs**
- New behavior has tests (unit + e2e for auth rules). Tests clean up their data. Would the tests actually fail if the change were wrong?
- README, `skills/`, and RAG/`llm` docs updated when behavior they describe changed (and re-ingested).

**Scope**
- The diff does what was asked — no unrelated refactors, no dead code, no speculative abstractions, no committed debug files or scratch scripts.

## Output format

Group by severity; within each, most serious first. For every finding:

```
[severity] path/to/file.ts:LINE — one-sentence statement of the defect
  Failure: concrete input/state → wrong result
  Fix: the smallest change that resolves it
```

Severities: **blocker** (security hole, data loss, broken build/tests), **major** (wrong behavior in a plausible case), **minor** (clarity, consistency, small risk), **nit** (style). End with:

- **Verified:** commands you actually ran and their result.
- **Not verified:** what you couldn't run or check, and why.
- If there are no findings, say so plainly — don't invent any.
