import "dotenv/config";
import { ask } from "./rag.js";

const question = process.argv.slice(2).join(" ");

if (!question) {
  console.error('Usage: npm run ask "your question here"');
  process.exit(1);
}

const { answer, sources } = await ask(question);

console.log("\n=== Answer ===\n");
console.log(answer);

console.log("\n=== Retrieved chunks (ranked by similarity) ===\n");
for (const s of sources) {
  console.log(`[${s.source}] score=${s.score.toFixed(3)}`);
  console.log(`  ${s.text.slice(0, 100)}${s.text.length > 100 ? "..." : ""}`);
}
