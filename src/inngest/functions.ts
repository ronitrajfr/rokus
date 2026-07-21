import { inngest } from "./client";
import { extractText } from "unpdf";
import { db } from "@/server/db";
import { chunks, sources } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { chunkPages, getEmbeddings } from "@/lib/pdf-utils";

export const processPDF = inngest.createFunction(
  { id: "process-pdf", triggers: { event: "app/pdf.uploaded" } },
  async ({ event, step }) => {
    const { sourceId, pdfUrl } = event.data;

    await step.run("mark-processing", async () => {
      await db
        .update(sources)
        .set({ status: "PROCESSING" })
        .where(eq(sources.id, sourceId));
    });

    try {
      const pages = await step.run("extract-text", async () => {
        const res = await fetch(pdfUrl);
        if (!res.ok)
          throw new Error(`Failed to fetch PDF: ${res.statusText}`);
        const buffer = await res.arrayBuffer();
        const { text } = await extractText(new Uint8Array(buffer));
        return text.map((pageText, i) => ({
          text: pageText,
          pageNumber: i + 1,
        }));
      });

      const textChunks = await step.run("chunk-text", async () => {
        return chunkPages(pages);
      });

      if (textChunks.length === 0) {
        await step.run("mark-ready-empty", async () => {
          await db
            .update(sources)
            .set({ status: "READY" })
            .where(eq(sources.id, sourceId));
        });
        return { message: "PDF has no extractable text", chunksCreated: 0 };
      }

      const embeddings = await step.run("generate-embeddings", async () => {
        return getEmbeddings(textChunks.map((c) => c.content));
      });

      await step.run("store-chunks", async () => {
        await db.insert(chunks).values(
          textChunks.map((chunk, i) => ({
            sourceId,
            chunkIndex: i,
            pageNumber: chunk.pageNumber,
            content: chunk.content,
            embedding: embeddings[i]!,
          })),
        );
      });

      await step.run("mark-ready", async () => {
        await db
          .update(sources)
          .set({ status: "READY" })
          .where(eq(sources.id, sourceId));
      });

      return {
        message: "PDF processed successfully",
        chunksCreated: textChunks.length,
      };
    } catch (error) {
      await step.run("mark-failed", async () => {
        await db
          .update(sources)
          .set({
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(sources.id, sourceId));
      });
      throw error;
    }
  },
);
