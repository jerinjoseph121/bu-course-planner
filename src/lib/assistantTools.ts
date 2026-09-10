import { prisma } from "@/lib/prisma";
import { formatDays, formatTime, meetingsOverlap } from "@/lib/time";
import { CURRENT_TERM } from "@/lib/term";
import type { ToolDeclaration } from "@/lib/gemini";

export const ASSISTANT_TOOLS: ToolDeclaration[] = [
  {
    name: "find_course",
    description:
      "Search the course catalog by keyword (course code, title, or department). Use this to confirm the exact courseCode and sectionCode before adding a course, or when the student refers to a course loosely (e.g. 'the machine learning class').",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "Search text, e.g. 'CAS CS 542', 'machine learning', or 'economics'.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "add_course_section",
    description:
      "Add a specific course section to the student's schedule. Always confirm the exact courseCode and sectionCode (e.g. via find_course) before calling this. Returns any scheduling conflicts with the student's existing classes — if there are conflicts, discuss them with the student before taking further action, don't silently remove other classes.",
    parameters: {
      type: "OBJECT",
      properties: {
        courseCode: { type: "STRING", description: "e.g. 'CAS CS 542'" },
        sectionCode: { type: "STRING", description: "e.g. 'A1'" },
      },
      required: ["courseCode", "sectionCode"],
    },
  },
  {
    name: "remove_course_from_schedule",
    description:
      "Remove a class or exam from the student's schedule by course code. If the course has multiple schedule entries (e.g. a lecture and a discussion), pass `type` to disambiguate (e.g. 'Lecture', 'Discussion', 'Exam'); if omitted and multiple entries match, this returns the list of candidates instead of deleting anything, so you can ask the student which one or retry with `type`.",
    parameters: {
      type: "OBJECT",
      properties: {
        courseCode: { type: "STRING", description: "e.g. 'CAS CS 501'" },
        type: {
          type: "STRING",
          description: "Optional: 'Lecture', 'Discussion', 'Practicum', 'Exam', etc., to disambiguate.",
        },
      },
      required: ["courseCode"],
    },
  },
];

type ToolResult = { mutated: boolean; [key: string]: unknown };

export async function executeAssistantTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case "find_course":
      return findCourse(String(args.query ?? ""));
    case "add_course_section":
      return addCourseSection(String(args.courseCode ?? ""), String(args.sectionCode ?? ""));
    case "remove_course_from_schedule":
      return removeCourseFromSchedule(
        String(args.courseCode ?? ""),
        args.type ? String(args.type) : undefined
      );
    default:
      return { mutated: false, error: `Unknown tool: ${name}` };
  }
}

async function findCourse(query: string): Promise<ToolResult> {
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { code: { contains: query } },
        { title: { contains: query } },
        { department: { contains: query } },
      ],
    },
    include: { sections: { where: { term: CURRENT_TERM } } },
    take: 10,
  });

  return {
    mutated: false,
    results: courses.map((c) => ({
      courseCode: c.code,
      title: c.title,
      department: c.department,
      school: c.school,
      level: c.level,
      credits: c.credits,
      sections: c.sections.map((s) => ({
        sectionCode: s.sectionCode,
        type: s.type,
        days: formatDays(s.days),
        time: `${formatTime(s.startTime)}-${formatTime(s.endTime)}`,
        location: s.location,
        instructor: s.instructor,
      })),
    })),
  };
}

async function addCourseSection(courseCode: string, sectionCode: string): Promise<ToolResult> {
  const course = await prisma.course.findUnique({
    where: { code: courseCode },
    include: { sections: { where: { term: CURRENT_TERM } } },
  });
  if (!course) {
    return { mutated: false, error: `No course found with code "${courseCode}". Use find_course to look up the correct code.` };
  }

  const section = course.sections.find(
    (s) => s.sectionCode.toLowerCase() === sectionCode.toLowerCase()
  );
  if (!section) {
    return {
      mutated: false,
      error: `Course ${courseCode} has no section "${sectionCode}". Available sections: ${
        course.sections.map((s) => `${s.sectionCode} (${s.type})`).join(", ") || "none"
      }.`,
    };
  }

  const existing = await prisma.scheduleItem.findFirst({
    where: { term: CURRENT_TERM, sectionId: section.id },
  });
  if (existing) {
    return { mutated: false, error: `${courseCode} (${section.type} ${section.sectionCode}) is already on the schedule.` };
  }

  const created = await prisma.scheduleItem.create({
    data: {
      term: CURRENT_TERM,
      kind: "class",
      sectionId: section.id,
      courseCode: course.code,
      title: course.title,
      type: section.type,
      instructor: section.instructor,
      location: section.location,
      days: section.days,
      startTime: section.startTime,
      endTime: section.endTime,
    },
  });

  const others = await prisma.scheduleItem.findMany({
    where: { term: CURRENT_TERM, kind: "class", id: { not: created.id } },
  });
  const conflicts = others
    .filter((o) => meetingsOverlap(created, o))
    .map((o) => ({
      courseCode: o.courseCode,
      title: o.title,
      type: o.type,
      days: formatDays(o.days),
      time: `${formatTime(o.startTime)}-${formatTime(o.endTime)}`,
    }));

  return {
    mutated: true,
    added: {
      courseCode: course.code,
      title: course.title,
      type: section.type,
      days: formatDays(section.days),
      time: `${formatTime(section.startTime)}-${formatTime(section.endTime)}`,
      location: section.location,
    },
    conflicts,
  };
}

async function removeCourseFromSchedule(courseCode: string, type?: string): Promise<ToolResult> {
  const items = await prisma.scheduleItem.findMany({
    where: {
      term: CURRENT_TERM,
      courseCode: { equals: courseCode },
      ...(type ? { type: { contains: type } } : {}),
    },
  });

  if (items.length === 0) {
    return { mutated: false, error: `Nothing on the schedule matches course "${courseCode}"${type ? ` with type "${type}"` : ""}.` };
  }

  if (items.length > 1) {
    return {
      mutated: false,
      error: "Multiple schedule entries match — ask the student which one, or call again with `type` set to one of these.",
      candidates: items.map((i) => ({
        courseCode: i.courseCode,
        title: i.title,
        type: i.type,
        days: formatDays(i.days),
        time: `${formatTime(i.startTime)}-${formatTime(i.endTime)}`,
      })),
    };
  }

  const [item] = items;
  await prisma.scheduleItem.delete({ where: { id: item.id } });

  return {
    mutated: true,
    removed: {
      courseCode: item.courseCode,
      title: item.title,
      type: item.type,
    },
  };
}
