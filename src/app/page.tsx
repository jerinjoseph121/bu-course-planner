import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDays, formatTime } from "@/lib/time";

const TERM = "Fall 2026";

export default async function HomePage() {
  const [courseCount, departmentCount, scheduleItems] = await Promise.all([
    prisma.course.count(),
    prisma.course
      .findMany({ select: { department: true }, distinct: ["department"] })
      .then((r) => r.length),
    prisma.scheduleItem.findMany({
      where: { term: TERM },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const classes = scheduleItems.filter((i) => i.kind === "class");
  const exams = scheduleItems.filter((i) => i.kind === "exam");
  const totalCredits = new Set(classes.map((c) => c.courseCode)).size;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back 👋
        </h1>
        <p className="mt-1 text-slate-600">
          Browse the BU course catalog and manage your {TERM} schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Courses in catalog" value={courseCount} />
        <StatCard label="Departments" value={departmentCount} />
        <StatCard label="Courses on your schedule" value={totalCredits} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/courses"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Course Navigator
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Search and filter BU courses by school, department, level,
            credits, and meeting day.
          </p>
        </Link>
        <Link
          href="/schedule"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Schedule Builder
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            View your weekly schedule, add or remove classes, and log exam
            dates.
          </p>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Your {TERM} classes
        </h2>
        {classes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No classes on your schedule yet. Head to the{" "}
            <Link href="/courses" className="text-red-700 underline">
              Course Navigator
            </Link>{" "}
            to add some.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {classes.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-900">
                    {item.courseCode}
                  </span>{" "}
                  <span className="text-slate-500">— {item.title}</span>
                  {item.type && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      {item.type}
                    </span>
                  )}
                </div>
                <div className="text-slate-500">
                  {formatDays(item.days)} · {formatTime(item.startTime)}–
                  {formatTime(item.endTime)}
                </div>
              </li>
            ))}
          </ul>
        )}
        {exams.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-slate-700">
              Exams
            </h3>
            <ul className="mt-2 divide-y divide-slate-100">
              {exams.map((item) => (
                <li key={item.id} className="py-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">
                    {item.courseCode}
                  </span>{" "}
                  — {item.title} · {item.examDate}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}
