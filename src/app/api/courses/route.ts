import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const school = params.get("school");
  const department = params.get("department");
  const level = params.get("level");
  const credits = params.get("credits");
  const day = params.get("day");
  const term = params.get("term") ?? "Fall 2026";

  const where: Record<string, unknown> = {};

  if (school) where.school = school;
  if (department) where.department = department;
  if (level) where.level = level;
  if (credits) where.credits = parseFloat(credits);

  if (q) {
    where.OR = [
      { code: { contains: q } },
      { title: { contains: q } },
      { description: { contains: q } },
      { subjectCode: { contains: q } },
    ];
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      sections: { where: { term } },
    },
    orderBy: { code: "asc" },
  });

  const filtered = day
    ? courses.filter((c) =>
        c.sections.some((s) => s.days.split(",").includes(day))
      )
    : courses;

  return NextResponse.json(filtered);
}
