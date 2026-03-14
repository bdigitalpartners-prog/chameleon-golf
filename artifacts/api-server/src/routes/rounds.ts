import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { coursesTable, roundsTable, scoresTable } from "@workspace/db/schema";
import { CreateRoundBody, SaveScoresBody } from "@workspace/api-zod";
import { eq, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/rounds", async (_req, res) => {
  const rounds = await db
    .select({
      id: roundsTable.id,
      courseId: roundsTable.courseId,
      courseName: coursesTable.name,
      playerName: roundsTable.playerName,
      date: roundsTable.date,
      createdAt: roundsTable.createdAt,
      totalScore: sql<number>`coalesce(sum(${scoresTable.strokes}), 0)`.as("total_score"),
      totalPar: sql<number>`coalesce(sum(${scoresTable.par}), 0)`.as("total_par"),
    })
    .from(roundsTable)
    .leftJoin(coursesTable, eq(roundsTable.courseId, coursesTable.id))
    .leftJoin(scoresTable, eq(scoresTable.roundId, roundsTable.id))
    .groupBy(roundsTable.id, coursesTable.name)
    .orderBy(desc(roundsTable.date));
  res.json(rounds);
});

router.post("/rounds", async (req, res) => {
  const body = CreateRoundBody.parse(req.body);
  const [round] = await db
    .insert(roundsTable)
    .values({
      courseId: body.courseId,
      playerName: body.playerName,
      date: body.date ? new Date(body.date) : new Date(),
    })
    .returning();
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, round.courseId));
  res.status(201).json({ ...round, courseName: course?.name ?? null, totalScore: 0, totalPar: 0 });
});

router.get("/rounds/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [round] = await db
    .select({
      id: roundsTable.id,
      courseId: roundsTable.courseId,
      courseName: coursesTable.name,
      playerName: roundsTable.playerName,
      date: roundsTable.date,
      createdAt: roundsTable.createdAt,
    })
    .from(roundsTable)
    .leftJoin(coursesTable, eq(roundsTable.courseId, coursesTable.id))
    .where(eq(roundsTable.id, id));

  if (!round) {
    res.status(404).json({ error: "Round not found" });
    return;
  }

  const scores = await db
    .select()
    .from(scoresTable)
    .where(eq(scoresTable.roundId, id))
    .orderBy(scoresTable.holeNumber);

  const totalScore = scores.reduce((sum, s) => sum + s.strokes, 0);
  const totalPar = scores.reduce((sum, s) => sum + s.par, 0);

  res.json({ ...round, scores, totalScore, totalPar });
});

router.delete("/rounds/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(roundsTable).where(eq(roundsTable.id, id));
  res.status(204).send();
});

router.post("/rounds/:id/scores", async (req, res) => {
  const roundId = Number(req.params.id);
  const body = SaveScoresBody.parse(req.body);

  await db.delete(scoresTable).where(eq(scoresTable.roundId, roundId));

  if (body.scores.length === 0) {
    res.json([]);
    return;
  }

  const inserted = await db
    .insert(scoresTable)
    .values(
      body.scores.map((s) => ({
        roundId,
        holeNumber: s.holeNumber,
        par: s.par,
        strokes: s.strokes,
        notes: s.notes ?? null,
      }))
    )
    .returning();

  res.json(inserted);
});

export default router;
