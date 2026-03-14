import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";

export const roundsTable = pgTable("rounds", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  playerName: text("player_name").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoundSchema = createInsertSchema(roundsTable).omit({ id: true, createdAt: true });
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof roundsTable.$inferSelect;
