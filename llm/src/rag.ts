import { GoogleGenAI } from "@google/genai";
import { embed } from "./embeddings.js";
import { loadStore, topK } from "./store.js";

const ai = new GoogleGenAI({});
const TOP_K = 4;

export type RagAnswer = {
  answer: string;
  sources: { source: string; score: number; text: string }[];
};

export async function ask(question: string): Promise<RagAnswer> {
  const store = await loadStore();
  const [queryEmbedding] = await embed([question]);
  const matches = topK(store, queryEmbedding, TOP_K);

  const context = matches
    .map((m, i) => `[${i + 1}] (from ${m.source})\n${m.text}`)
    .join("\n\n");

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
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
}
