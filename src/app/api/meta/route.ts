import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const courses = await prisma.course.findMany({
    select: { school: true, department: true, level: true, credits: true },
  });

  const uniq = (arr: string[]) => Array.from(new Set(arr)).sort();

  return NextResponse.json({
    schools: uniq(courses.map((c) => c.school)),
    departments: uniq(courses.map((c) => c.department)),
    levels: uniq(courses.map((c) => c.level)),
    credits: Array.from(new Set(courses.map((c) => c.credits))).sort(
      (a, b) => a - b
    ),
  });
}
