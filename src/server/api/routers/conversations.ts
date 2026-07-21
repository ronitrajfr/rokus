import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { PDFDocument } from "pdf-lib";
import { conversations, sources } from "@/server/db/schema";
import { inngest } from "@/inngest/client";

export const conversationRouter = createTRPCRouter({
  createConversation: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const res = await fetch(input.url);
        if (
          !res.ok ||
          !res.headers.get("content-type")?.includes("application/pdf")
        ) {
          throw new Error("URL does not point to a valid PDF");
        }

        const arrayBuffer = await res.arrayBuffer();
        const maxSize = 32 * 1024 * 1024;
        if (arrayBuffer.byteLength > maxSize) {
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "PDF too large (max 32MB)",
          });
        }
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const pdfName = pdfDoc.getTitle();

        const [conversation] = await ctx.db
          .insert(conversations)
          .values({
            title: pdfName,
            userId: ctx.session.user.id,
          })
          .returning();

        const [source] = await ctx.db
          .insert(sources)
          .values({
            conversationId: conversation!.id,
            type: "PDF",
            fileName: pdfName,
            fileUrl: input.url,
          })
          .returning();

        await inngest.send({
          name: "app/pdf.uploaded",
          data: {
            sourceId: source!.id,
            conversationId: conversation!.id,
            pdfUrl: input.url,
          },
        });

        return conversation;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred, please try again later.",
        });
      }
    }),
});
