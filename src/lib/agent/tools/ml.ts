import { Type, type FunctionDeclaration } from "@google/genai";

export const classifyIrisDeclaration: FunctionDeclaration = {
  name: "classify_iris",
  description:
    "Classifies an iris flower's species from its measurements, using a trained ML model. " +
    "Use this instead of guessing when asked to identify/classify/predict a flower's species.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sepal_length: { type: Type.NUMBER, description: "Sepal length in cm." },
      sepal_width: { type: Type.NUMBER, description: "Sepal width in cm." },
      petal_length: { type: Type.NUMBER, description: "Petal length in cm." },
      petal_width: { type: Type.NUMBER, description: "Petal width in cm." },
    },
    required: ["sepal_length", "sepal_width", "petal_length", "petal_width"],
  },
};

export async function classifyIris(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${process.env.PYTHON_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sepal_length: args.sepal_length,
      sepal_width: args.sepal_width,
      petal_length: args.petal_length,
      petal_width: args.petal_width,
    }),
  });
  if (!res.ok) return { error: `Python service returned ${res.status}` };
  return res.json();
}
