import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { meetingsOverlap } from "@/lib/time";

const DEFAULT_TERM = "Fall 2026";

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get("term") ?? DEFAULT_TERM;
  const items = await prisma.scheduleItem.findMany({
    where: { term },
    orderBy: [{ startTime: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const term: string = body.term ?? DEFAULT_TERM;
  const kind: string = body.kind ?? "class";

  if (!body.courseCode || !body.title) {
    return NextResponse.json(
      { error: "courseCode and title are required" },
      { status: 400 }
    );
  }

  if (kind === "class" && (!body.days || !body.startTime || !body.endTime)) {
    return NextResponse.json(
      { error: "days, startTime, and endTime are required for a class entry" },
      { status: 400 }
    );
  }

  const created = await prisma.scheduleItem.create({
    data: {
      term,
      kind,
      sectionId: body.sectionId ?? null,
      courseCode: body.courseCode,
      title: body.title,
      type: body.type ?? null,
      instructor: body.instructor ?? null,
      location: body.location ?? null,
      days: body.days ?? "",
      startTime: body.startTime ?? "",
      endTime: body.endTime ?? "",
      examDate: body.examDate ?? null,
      notes: body.notes ?? null,
    },
  });

  let conflicts: { id: string; title: string; days: string; startTime: string; endTime: string }[] = [];

  if (kind === "class") {
    const others = await prisma.scheduleItem.findMany({
      where: { term, kind: "class", id: { not: created.id } },
    });
    conflicts = others
      .filter((o) => meetingsOverlap(created, o))
      .map((o) => ({
        id: o.id,
        title: o.title,
        days: o.days,
        startTime: o.startTime,
        endTime: o.endTime,
      }));
  }

  return NextResponse.json({ item: created, conflicts }, { status: 201 });
}
