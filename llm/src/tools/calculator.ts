import { Type, type FunctionDeclaration } from "@google/genai";

export const sumDeclaration: FunctionDeclaration = {
  name: "sum",
  description: "Adds up a list of numbers and returns the total. Use this for arithmetic instead of doing it yourself.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      numbers: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description: "The numbers to add together.",
      },
    },
    required: ["numbers"],
  },
};

export async function sum(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const numbers = Array.isArray(args.numbers) ? (args.numbers as number[]) : [];
  return { total: numbers.reduce((a, b) => a + b, 0) };
}
