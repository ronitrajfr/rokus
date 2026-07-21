import { relations } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  primaryKey,
  pgEnum,
  vector,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `rokus_${name}`);

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const roleEnum = pgEnum("role", ["USER", "ASSISTANT", "SYSTEM"]);

export const sourceTypeEnum = pgEnum("source_type", [
  "PDF",
  "PPT",
  "DOC",
  "TXT",
  "IMAGE",
  "AUDIO",
  "VIDEO",
  "WEBSITE",
  "YOUTUBE",
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
]);

/* -------------------------------------------------------------------------- */
/*                              Auth (NextAuth)                               */
/* -------------------------------------------------------------------------- */

export const users = createTable(
  "user",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }),
    email: d.varchar({ length: 255 }).notNull(),
    emailVerified: d
      .timestamp({
        mode: "date",
        withTimezone: true,
      })
      .$defaultFn(() => /* @__PURE__ */ new Date()),
    image: d.varchar({ length: 255 }),
  }),
  (t) => [index("user_email_idx").on(t.email)],
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  conversations: many(conversations),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* -------------------------------------------------------------------------- */
/*                         Notebooks / Conversations                          */
/* -------------------------------------------------------------------------- */

// Top-level container shown in the sidebar (a "notebook") -- holds
// one or more Sources, and one or more Tabs for chatting about them.
export const conversations = createTable(
  "conversation",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: d.varchar({ length: 255 }),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [index("conversation_user_id_idx").on(t.userId)],
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    sources: many(sources),
    tabs: many(tabs),
  }),
);

export const sources = createTable(
  "source",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    type: sourceTypeEnum("type").notNull(),
    status: sourceStatusEnum("status").notNull().default("PENDING"),
    title: d.varchar({ length: 255 }),
    // Uploaded files
    fileName: d.varchar({ length: 255 }),
    fileUrl: d.text(),
    // External resources
    url: d.text(),
    // Extra metadata (duration, thumbnail, pages, etc.)
    metadata: d.jsonb(),
    errorMessage: d.text(), // populated if status = FAILED
    createdAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index("source_conversation_id_idx").on(t.conversationId),
    index("source_status_idx").on(t.status),
  ],
);

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [sources.conversationId],
    references: [conversations.id],
  }),
  chunks: many(chunks),
  flashcardSets: many(flashcardSets),
}));

export const chunks = createTable(
  "chunk",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sourceId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    chunkIndex: d.integer().notNull(),
    pageNumber: d.integer(),
    content: d.text().notNull(),
    // Requires the pgvector extension. Run this once against your database
    // before generating/running migrations (Drizzle won't do it for you):
    //   CREATE EXTENSION IF NOT EXISTS vector;
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index("chunk_source_id_idx").on(t.sourceId),
    index("chunk_embedding_idx")
      .using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
);

export const chunksRelations = relations(chunks, ({ one }) => ({
  source: one(sources, { fields: [chunks.sourceId], references: [sources.id] }),
}));

// A single chat thread ("tab") within a conversation/notebook.
// Multiple tabs share the same set of Sources but keep separate message history.
export const tabs = createTable(
  "tab",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    title: d.varchar({ length: 255 }).notNull().default("New tab"),
    createdAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [index("tab_conversation_id_idx").on(t.conversationId)],
);

export const tabsRelations = relations(tabs, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [tabs.conversationId],
    references: [conversations.id],
  }),
  messages: many(messages),
  flashcardSets: many(flashcardSets),
}));

export const messages = createTable(
  "message",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tabId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tabs.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    content: d.text().notNull(),
    createdAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [index("message_tab_id_idx").on(t.tabId)],
);

export const messagesRelations = relations(messages, ({ one }) => ({
  tab: one(tabs, { fields: [messages.tabId], references: [tabs.id] }),
}));

export const flashcardSets = createTable(
  "flashcard_set",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sourceId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    tabId: d
      .varchar({ length: 255 })
      .references(() => tabs.id, { onDelete: "set null" }),
    topic: d.varchar({ length: 255 }).notNull(),
    title: d.varchar({ length: 255 }).notNull(),
    createdAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (t) => [
    index("flashcard_set_source_id_idx").on(t.sourceId),
    index("flashcard_set_tab_id_idx").on(t.tabId),
  ],
);

export const flashcardSetsRelations = relations(
  flashcardSets,
  ({ one, many }) => ({
    source: one(sources, {
      fields: [flashcardSets.sourceId],
      references: [sources.id],
    }),
    tab: one(tabs, { fields: [flashcardSets.tabId], references: [tabs.id] }),
    flashcards: many(flashcards),
  }),
);

export const flashcards = createTable(
  "flashcard",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    setId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => flashcardSets.id, { onDelete: "cascade" }),
    question: d.text().notNull(),
    answer: d.text().notNull(),
    position: d.integer().notNull().default(0),
  }),
  (t) => [index("flashcard_set_id_idx").on(t.setId)],
);

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  set: one(flashcardSets, {
    fields: [flashcards.setId],
    references: [flashcardSets.id],
  }),
}));
