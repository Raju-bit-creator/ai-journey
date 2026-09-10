import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = (await pipeline(
      "feature-extraction",
      MODEL_ID,
    )) as FeatureExtractionPipeline;
  }
  return extractor;
}

/** Embeds one or more strings into 384-dimensional vectors, mean-pooled and normalized. */
export async function embed(texts: string[]): Promise<number[][]> {
  const model = await getExtractor();
  const output = await model(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}
