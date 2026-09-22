"use server";

import { runAgent, type ToolCallTrace } from "@/lib/agent";

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  toolCalls?: ToolCallTrace[];
};

export async function sendMessage(
  prevMessages: ChatMessage[],
  formData: FormData,
): Promise<ChatMessage[]> {
  const question = formData.get("message");
  if (typeof question !== "string" || !question.trim()) {
    return prevMessages;
  }

  const { answer, toolCalls } = await runAgent(question);

  return [
    ...prevMessages,
    { role: "user", text: question },
    { role: "assistant", text: answer, toolCalls },
  ];
}
