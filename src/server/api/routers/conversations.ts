import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
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
      const result = await ctx.db.transaction(async (tx) => {
        const [conversation] = await tx
          .insert(conversations)
          .values({ userId: ctx.session.user.id })
          .returning();

        if (!conversation) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create conversation.",
          });
        }

        const [source] = await tx
          .insert(sources)
          .values({
            conversationId: conversation.id,
            type: "PDF",
            fileUrl: input.url,
          })
          .returning();

        if (!source) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create source.",
          });
        }

        return { conversation, source };
      });

      await inngest.send({
        name: "app/pdf.uploaded",
        data: {
          sourceId: result.source.id,
          pdfUrl: input.url,
          conversationId: result.conversation.id,
        },
      });

      return result.conversation;
    }),
});
