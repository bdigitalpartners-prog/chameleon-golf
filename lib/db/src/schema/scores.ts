import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { roundsTable } from "./rounds";

export const scoresTable = pgTable("scores", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull().references(() => roundsTable.id, { onDelete: "cascade" }),
  holeNumber: integer("hole_number").notNull(),
  par: integer("par").notNull(),
  strokes: integer("strokes").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScoreSchema = createInsertSchema(scoresTable).omit({ id: true, createdAt: true });
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scoresTable.$inferSelect;
