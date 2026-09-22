import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { embed } from "../src/lib/rag/embeddings";
import { saveStore, type StoredChunk } from "../src/lib/rag/store";

const DOCS_DIR = path.join(process.cwd(), "src/lib/rag/docs");

function chunkMarkdown(text: string, source: string): { text: string; source: string }[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("#"))
    .map((text) => ({ text, source }));
}

async function main() {
  const files = (await readdir(DOCS_DIR)).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} doc(s): ${files.join(", ")}`);

  const chunks: { text: string; source: string }[] = [];
  for (const file of files) {
    const content = await readFile(path.join(DOCS_DIR, file), "utf-8");
    chunks.push(...chunkMarkdown(content, file));
  }
  console.log(`Split into ${chunks.length} chunks. Embedding...`);

  const embeddings = await embed(chunks.map((c) => c.text));

  const stored: StoredChunk[] = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  await saveStore(stored);
  console.log(`Saved ${stored.length} embedded chunks to src/lib/rag/vector-store.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
