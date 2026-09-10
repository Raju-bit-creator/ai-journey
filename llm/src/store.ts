import { readFile, writeFile } from "node:fs/promises";

export type StoredChunk = {
  text: string;
  source: string;
  embedding: number[];
};

const STORE_PATH = new URL("../vector-store.json", import.meta.url);

export async function saveStore(chunks: StoredChunk[]): Promise<void> {
  await writeFile(STORE_PATH, JSON.stringify(chunks));
}

export async function loadStore(): Promise<StoredChunk[]> {
  const raw = await readFile(STORE_PATH, "utf-8").catch(() => {
    throw new Error(
      "No vector store found. Run `npm run ingest` first to build it.",
    );
  });
  return JSON.parse(raw);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // embeddings are already normalized, so dot product == cosine similarity
}

export function topK(
  chunks: StoredChunk[],
  queryEmbedding: number[],
  k: number,
): (StoredChunk & { score: number })[] {
  return chunks
    .map((chunk) => ({ ...chunk, score: cosineSimilarity(chunk.embedding, queryEmbedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
