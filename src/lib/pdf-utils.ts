import { env } from "@/env";

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;
const EMBEDDING_BATCH_SIZE = 100;
const EMBEDDING_MODEL = "text-embedding-3-small";

export function chunkPages(
  pages: { text: string; pageNumber: number }[],
): { content: string; pageNumber: number }[] {
  const result: { content: string; pageNumber: number }[] = [];

  for (const page of pages) {
    if (page.text.trim().length === 0) continue;

    if (page.text.length <= CHUNK_SIZE) {
      result.push({ content: page.text.trim(), pageNumber: page.pageNumber });
      continue;
    }

    let start = 0;
    while (start < page.text.length) {
      const end = Math.min(start + CHUNK_SIZE, page.text.length);
      const chunkContent = page.text.slice(start, end).trim();
      if (chunkContent.length > 0) {
        result.push({ content: chunkContent, pageNumber: page.pageNumber });
      }
      start += CHUNK_SIZE - CHUNK_OVERLAP;
    }
  }

  return result;
}

export async function getEmbeddings(
  texts: string[],
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `OpenAI embedding failed: ${res.status} ${await res.text()}`,
      );
    }

    const data = (await res.json()) as {
      data: { index: number; embedding: number[] }[];
    };

    const sorted = data.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map((e) => e.embedding));
  }

  return allEmbeddings;
}
