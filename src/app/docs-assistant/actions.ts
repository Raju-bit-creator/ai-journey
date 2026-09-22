"use server";

import { ask, type RagSource } from "@/lib/rag/rag";

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: RagSource[];
};

export async function sendMessage(
  prevMessages: ChatMessage[],
  formData: FormData,
): Promise<ChatMessage[]> {
  const question = formData.get("message");
  if (typeof question !== "string" || !question.trim()) {
    return prevMessages;
  }

  const { answer, sources } = await ask(question);

  return [
    ...prevMessages,
    { role: "user", text: question },
    { role: "assistant", text: answer, sources },
  ];
}
