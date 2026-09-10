import {
  GoogleGenAI,
  createPartFromFunctionResponse,
  createUserContent,
  type Content,
  type FunctionDeclaration,
} from "@google/genai";
import { getProduct, getProductDeclaration, listProducts, listProductsDeclaration } from "./tools/products.js";
import { sum, sumDeclaration } from "./tools/calculator.js";

const ai = new GoogleGenAI({});
const MODEL = "gemini-3.6-flash";
const MAX_TURNS = 6;

type Tool = {
  declaration: FunctionDeclaration;
  execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

const tools: Record<string, Tool> = {
  list_products: { declaration: listProductsDeclaration, execute: listProducts },
  get_product: { declaration: getProductDeclaration, execute: getProduct },
  sum: { declaration: sumDeclaration, execute: sum },
};

export type ToolCallTrace = {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
};

export type AgentAnswer = {
  answer: string;
  toolCalls: ToolCallTrace[];
};

export async function runAgent(question: string): Promise<AgentAnswer> {
  const contents: Content[] = [createUserContent(question)];
  const toolCalls: ToolCallTrace[] = [];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        tools: [{ functionDeclarations: Object.values(tools).map((t) => t.declaration) }],
        systemInstruction:
          "You are an assistant with access to a product catalog and a calculator tool. " +
          "Use the tools to answer questions accurately instead of guessing at numbers.",
      },
    });

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      return { answer: response.text ?? "", toolCalls };
    }

    // Push the model's actual response content (not a reconstruction) so that
    // sibling fields on each Part, like thoughtSignature, are preserved when
    // this turn is replayed on the next request.
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
}
