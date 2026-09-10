import "dotenv/config";
import { runAgent } from "./agent.js";

const question = process.argv.slice(2).join(" ");

if (!question) {
  console.error('Usage: npm run agent -- "your question here"');
  process.exit(1);
}

const { answer, toolCalls } = await runAgent(question);

console.log("\n=== Tool calls ===\n");
for (const call of toolCalls) {
  console.log(`${call.name}(${JSON.stringify(call.args)})`);
  console.log(`  -> ${JSON.stringify(call.result).slice(0, 200)}`);
}

console.log("\n=== Answer ===\n");
console.log(answer);
