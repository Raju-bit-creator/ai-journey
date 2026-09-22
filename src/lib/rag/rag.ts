import { ApiError, GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { embed } from "./embeddings";
import { loadStore, topK } from "./store";

const ai = new GoogleGenAI({});
const MODEL = "gemini-3.6-flash";
const TOP_K = 4;
const MAX_RETRIES = 3;

const RETRYABLE_STATUS_CODES = new Set([429, 503]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateContentWithRetry(
  params: Parameters<typeof ai.models.generateContent>[0],
): Promise<GenerateContentResponse> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      const retryable = err instanceof ApiError && RETRYABLE_STATUS_CODES.has(err.status);
      if (!retryable || attempt >= MAX_RETRIES - 1) throw err;
      await sleep(1000 * 2 ** attempt);
    }
  }
}

export type RagSource = { source: string; score: number; text: string };

export type RagAnswer = {
  answer: string;
  sources: RagSource[];
};

export async function ask(question: string): Promise<RagAnswer> {
  const store = await loadStore();
  const [queryEmbedding] = await embed([question]);
  const matches = topK(store, queryEmbedding, TOP_K);

  const context = matches.map((m, i) => `[${i + 1}] (from ${m.source})\n${m.text}`).join("\n\n");

  try {
    const response = await generateContentWithRetry({
      model: MODEL,
      contents: `Context excerpts:\n\n${context}\n\nQuestion: ${question}`,
      config: {
        systemInstruction:
          "You answer questions about a specific software project using only the provided context excerpts. " +
          "Cite which excerpt number(s) support each claim, like [1] or [2][3]. " +
          "If the context doesn't contain the answer, say so plainly instead of guessing.",
      },
    });

    return {
      answer: response.text ?? "",
      sources: matches.map((m) => ({ source: m.source, score: m.score, text: m.text })),
    };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Something went wrong.";
    return {
      answer: `Sorry, I couldn't get an answer (${message}). Try again in a moment.`,
      sources: matches.map((m) => ({ source: m.source, score: m.score, text: m.text })),
    };
  }
}
