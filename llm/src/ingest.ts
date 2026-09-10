import { readdir, readFile } from "node:fs/promises";
import { chunkMarkdown } from "./chunk.js";
import { embed } from "./embeddings.js";
import { saveStore, type StoredChunk } from "./store.js";

const DOCS_DIR = new URL("../docs/", import.meta.url);

async function main() {
  const files = (await readdir(DOCS_DIR)).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} doc(s): ${files.join(", ")}`);

  const chunks: { text: string; source: string }[] = [];
  for (const file of files) {
    const content = await readFile(new URL(file, DOCS_DIR), "utf-8");
    chunks.push(...chunkMarkdown(content, file));
  }
  console.log(`Split into ${chunks.length} chunks. Embedding...`);

  const embeddings = await embed(chunks.map((c) => c.text));

  const stored: StoredChunk[] = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  await saveStore(stored);
  console.log(`Saved ${stored.length} embedded chunks to vector-store.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
