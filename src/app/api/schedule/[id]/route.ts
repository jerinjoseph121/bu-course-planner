import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { meetingsOverlap } from "@/lib/time";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.scheduleItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.scheduleItem.update({
    where: { id },
    data: {
      courseCode: body.courseCode ?? existing.courseCode,
      title: body.title ?? existing.title,
      type: body.type ?? existing.type,
      instructor: body.instructor ?? existing.instructor,
      location: body.location ?? existing.location,
      days: body.days ?? existing.days,
      startTime: body.startTime ?? existing.startTime,
      endTime: body.endTime ?? existing.endTime,
      examDate: body.examDate ?? existing.examDate,
      notes: body.notes ?? existing.notes,
    },
  });

  let conflicts: { id: string; title: string; days: string; startTime: string; endTime: string }[] = [];

  if (updated.kind === "class") {
    const others = await prisma.scheduleItem.findMany({
      where: { term: updated.term, kind: "class", id: { not: updated.id } },
    });
    conflicts = others
      .filter((o) => meetingsOverlap(updated, o))
      .map((o) => ({
        id: o.id,
        title: o.title,
        days: o.days,
        startTime: o.startTime,
        endTime: o.endTime,
      }));
  }

  return NextResponse.json({ item: updated, conflicts });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.scheduleItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.scheduleItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
