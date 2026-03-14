import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sources = await prisma.rankingSource.findMany({
    include: {
      lists: {
        orderBy: [{ prestigeTier: "asc" }, { listName: "asc" }],
        select: {
          listId: true,
          listName: true,
          prestigeTier: true,
          listWeight: true,
          yearPublished: true,
          region: true,
          _count: { select: { entries: true } },
        },
      },
    },
    orderBy: { authorityWeight: "desc" },
  });

  return NextResponse.json(sources);
}
