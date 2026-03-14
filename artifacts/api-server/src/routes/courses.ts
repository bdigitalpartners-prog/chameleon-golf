import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { coursesTable } from "@workspace/db/schema";
import { CreateCourseBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/courses", async (_req, res) => {
  const courses = await db.select().from(coursesTable).orderBy(coursesTable.name);
  res.json(courses);
});

router.post("/courses", async (req, res) => {
  const body = CreateCourseBody.parse(req.body);
  const [course] = await db
    .insert(coursesTable)
    .values({
      name: body.name,
      location: body.location ?? null,
      holes: body.holes,
      par: body.par,
    })
    .returning();
  res.status(201).json(course);
});

router.get("/courses/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  res.json(course);
});

export default router;
