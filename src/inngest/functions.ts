import { inngest } from "./client";
import { PDFDocument } from "pdf-lib";
import { extractText } from "unpdf";
import { db } from "@/server/db";
import { chunks, conversations, sources } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { chunkPages, getEmbeddings } from "@/lib/pdf-utils";

const MAX_PDF_SIZE = 32 * 1024 * 1024;
const EMBEDDING_DIMENSION = 1536;
const CHUNK_BATCH_SIZE = 100;

export const processPDF = inngest.createFunction(
  { id: "process-pdf", triggers: { event: "app/pdf.uploaded" } },
  async ({ event, step }) => {
    const { sourceId, pdfUrl, conversationId } = event.data;

    await step.run("mark-processing", async () => {
      await db
        .update(sources)
        .set({ status: "PROCESSING" })
        .where(eq(sources.id, sourceId));
    });

    try {
      const pages = await step.run("fetch-validate-extract", async () => {
        const res = await fetch(pdfUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch PDF: ${res.statusText}`);
        }

        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/pdf")) {
          throw new Error("URL does not point to a valid PDF");
        }

        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > MAX_PDF_SIZE) {
          throw new Error(
            `PDF too large: ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB (max 32MB)`,
          );
        }

        const pdfDoc = await PDFDocument.load(buffer);
        const title = pdfDoc.getTitle() ?? null;

        const { text } = await extractText(new Uint8Array(buffer));
        return {
          pages: text.map((pageText, i) => ({
            text: pageText,
            pageNumber: i + 1,
          })),
          title,
        };
      });

      const textChunks = await step.run("chunk-text", async () => {
        return chunkPages(pages.pages);
      });

      if (textChunks.length === 0) {
        await step.run("mark-ready-empty", async () => {
          await db
            .update(sources)
            .set({ status: "READY", title: pages.title })
            .where(eq(sources.id, sourceId));

          if (pages.title) {
            await db
              .update(conversations)
              .set({ title: pages.title })
              .where(eq(conversations.id, conversationId));
          }
        });
        return { message: "PDF has no extractable text", chunksCreated: 0 };
      }

      const embeddings = await step.run("generate-embeddings", async () => {
        const embs = await getEmbeddings(textChunks.map((c) => c.content));
        for (let i = 0; i < embs.length; i++) {
          if (embs[i]!.length !== EMBEDDING_DIMENSION) {
            throw new Error(
              `Embedding dimension mismatch at chunk ${i}: expected ${EMBEDDING_DIMENSION}, got ${embs[i]!.length}`,
            );
          }
        }
        return embs;
      });

      await step.run("store-chunks", async () => {
        for (let i = 0; i < textChunks.length; i += CHUNK_BATCH_SIZE) {
          const batch = textChunks.slice(i, i + CHUNK_BATCH_SIZE);
          const batchEmbeddings = embeddings.slice(i, i + CHUNK_BATCH_SIZE);
          await db
            .insert(chunks)
            .values(
              batch.map((chunk, j) => ({
                sourceId,
                chunkIndex: i + j,
                pageNumber: chunk.pageNumber,
                content: chunk.content,
                embedding: batchEmbeddings[j]!,
              })),
            )
            .onConflictDoNothing();
        }
      });

      await step.run("mark-ready", async () => {
        await db
          .update(sources)
          .set({ status: "READY", title: pages.title })
          .where(eq(sources.id, sourceId));

        if (pages.title) {
          await db
            .update(conversations)
            .set({ title: pages.title })
            .where(eq(conversations.id, conversationId));
        }
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
