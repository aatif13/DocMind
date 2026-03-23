import { pipeline } from "@xenova/transformers";
import Groq from "groq-sdk";

// Keep groq client exported — chat route uses it for LLM completions
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/nomic-embed-text-v1"
    );
  }
  return embedder;
}

export async function embedText(text: string): Promise<number[]> {
  const embed = await getEmbedder();
  const output = await embed(text, { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embed = await getEmbedder();
  const results: number[][] = [];
  for (const text of texts) {
    const output = await embed(text, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data) as number[]);
  }
  return results;
}
