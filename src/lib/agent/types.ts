import type { FunctionDeclaration } from "@google/genai";

export type Tool = {
  declaration: FunctionDeclaration;
  execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
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
