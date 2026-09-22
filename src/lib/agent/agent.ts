import {
  ApiError,
  GoogleGenAI,
  createPartFromFunctionResponse,
  createUserContent,
  type Content,
  type GenerateContentResponse,
} from "@google/genai";
import { listProducts, listProductsDeclaration, getProduct, getProductDeclaration } from "./tools/products";
import { sum, sumDeclaration } from "./tools/calculator";
import { classifyIris, classifyIrisDeclaration } from "./tools/ml";
import type { Tool, ToolCallTrace, AgentAnswer } from "./types";

const ai = new GoogleGenAI({});
const MODEL = "gemini-3.6-flash";
const MAX_TURNS = 6;
const MAX_RETRIES = 3;

const RETRYABLE_STATUS_CODES = new Set([429, 503]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Gemini's free tier occasionally returns 429/503 under load; these are
 * transient and worth a short retry instead of failing the whole request. */
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

const tools: Record<string, Tool> = {
  list_products: { declaration: listProductsDeclaration, execute: listProducts },
  get_product: { declaration: getProductDeclaration, execute: getProduct },
  sum: { declaration: sumDeclaration, execute: sum },
  classify_iris: { declaration: classifyIrisDeclaration, execute: classifyIris },
};

export async function runAgent(question: string): Promise<AgentAnswer> {
  const contents: Content[] = [createUserContent(question)];
  const toolCalls: ToolCallTrace[] = [];

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await generateContentWithRetry({
        model: MODEL,
        contents,
        config: {
          tools: [{ functionDeclarations: Object.values(tools).map((t) => t.declaration) }],
          systemInstruction:
            "You are an assistant embedded in a product catalog web app. You have access to the product " +
            "catalog, a calculator, and an iris-flower species classifier (a real trained ML model, not " +
            "a guess). Use the tools to answer questions accurately instead of guessing at numbers or " +
            "species. You currently cannot create, edit, or delete products — if asked to, say so plainly.",
        },
      });

      const calls = response.functionCalls;
      if (!calls || calls.length === 0) {
        return { answer: response.text ?? "", toolCalls };
      }

      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) contents.push(modelContent);

      const responseParts = [];
      for (const call of calls) {
        const tool = tools[call.name!];
        const result = tool ? await tool.execute(call.args ?? {}) : { error: `Unknown tool: ${call.name}` };
        toolCalls.push({ name: call.name!, args: call.args ?? {}, result });
        responseParts.push(createPartFromFunctionResponse(call.id ?? call.name!, call.name!, result));
      }
      contents.push(createUserContent(responseParts));
    }

    return { answer: "(gave up after too many tool-call turns)", toolCalls };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Something went wrong.";
    return {
      answer: `Sorry, I couldn't get an answer (${message}). Try again in a moment.`,
      toolCalls,
    };
  }
}
