"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDays, formatTime } from "@/lib/time";
import { SCHEDULE_CHANGED_EVENT } from "@/components/AssistantWidget";

type Section = {
  id: string;
  sectionCode: string;
  type: string;
  instructor: string | null;
  location: string | null;
  days: string;
  startTime: string;
  endTime: string;
};

type Course = {
  id: string;
  code: string;
  title: string;
  description: string;
  school: string;
  department: string;
  credits: number;
  level: string;
  hubUnits: string | null;
  sections: Section[];
};

type Meta = {
  schools: string[];
  departments: string[];
  levels: string[];
  credits: number[];
};

type ScheduleItem = { id: string; sectionId: string | null };

const DAY_OPTIONS = [
  { value: "MO", label: "Monday" },
  { value: "TU", label: "Tuesday" },
  { value: "WE", label: "Wednesday" },
  { value: "TH", label: "Thursday" },
  { value: "FR", label: "Friday" },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [school, setSchool] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [credits, setCredits] = useState("");
  const [day, setDay] = useState("");

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then(setMeta);
    refreshSchedule();
    window.addEventListener(SCHEDULE_CHANGED_EVENT, refreshSchedule);
    return () => window.removeEventListener(SCHEDULE_CHANGED_EVENT, refreshSchedule);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (school) params.set("school", school);
    if (department) params.set("department", department);
    if (level) params.set("level", level);
    if (credits) params.set("credits", credits);
    if (day) params.set("day", day);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for a manual filter-driven fetch, not a derivable value
    setLoading(true);
    fetch(`/api/courses?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setCourses(data))
      .finally(() => setLoading(false));
  }, [q, school, department, level, credits, day]);

  function refreshSchedule() {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then(setSchedule);
  }

  const scheduledSectionIds = useMemo(
    () => new Set(schedule.map((s) => s.sectionId).filter(Boolean)),
    [schedule]
  );

  async function addSection(course: Course, section: Section) {
    setMessage(null);
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId: section.id,
        courseCode: course.code,
        title: course.title,
        type: section.type,
        instructor: section.instructor,
        location: section.location,
        days: section.days,
        startTime: section.startTime,
        endTime: section.endTime,
      }),
    });
    const data = await res.json();
    refreshSchedule();
    if (data.conflicts?.length) {
      setMessage(
        `Added ${course.code} — heads up, it overlaps with ${data.conflicts
          .map((c: { title: string }) => c.title)
          .join(", ")}.`
      );
    } else {
      setMessage(`Added ${course.code} (${section.type}) to your schedule.`);
    }
  }

  async function removeSection(sectionId: string) {
    const item = schedule.find((s) => s.sectionId === sectionId);
    if (!item) return;
    await fetch(`/api/schedule/${item.id}`, { method: "DELETE" });
    refreshSchedule();
  }

  function clearFilters() {
    setQ("");
    setSchool("");
    setDepartment("");
    setLevel("");
    setCredits("");
    setDay("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Course Navigator
        </h1>
        <p className="mt-1 text-slate-600">
          Browse the BU course catalog. Filter by school, department, level,
          credits, or meeting day, then add sections straight to your
          schedule.
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {message}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            className="col-span-1 rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2 lg:col-span-2"
            placeholder="Search code, title, or keyword..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            value={school}
            onChange={setSchool}
            options={meta?.schools ?? []}
            placeholder="All schools"
          />
          <Select
            value={department}
            onChange={setDepartment}
            options={meta?.departments ?? []}
            placeholder="All departments"
          />
          <Select
            value={level}
            onChange={setLevel}
            options={meta?.levels ?? []}
            placeholder="All levels"
          />
          <Select
            value={credits}
            onChange={setCredits}
            options={meta?.credits.map(String) ?? []}
            placeholder="Any credits"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Meets on:</span>
          {DAY_OPTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDay(day === d.value ? "" : d.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                day === d.value
                  ? "bg-red-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d.label}
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="ml-auto text-xs font-medium text-slate-500 underline hover:text-slate-700"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        {loading ? "Loading..." : `${courses.length} course(s) found`}
      </div>

      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {course.code} — {course.title}
                </h3>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <Badge>{course.school}</Badge>
                  <Badge>{course.department}</Badge>
                  <Badge>{course.level}</Badge>
                  <Badge>{course.credits} credits</Badge>
                  {course.hubUnits && <Badge>Hub: {course.hubUnits}</Badge>}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {course.description}
            </p>

            <div className="mt-4 space-y-2">
              {course.sections.map((section) => {
                const isAdded = scheduledSectionIds.has(section.id);
                return (
                  <div
                    key={section.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium text-slate-800">
                        {section.type} {section.sectionCode}
                      </span>
                      <span className="ml-2 text-slate-500">
                        {formatDays(section.days)} ·{" "}
                        {formatTime(section.startTime)}–
                        {formatTime(section.endTime)}
                        {section.location && ` · ${section.location}`}
                        {section.instructor && ` · ${section.instructor}`}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        isAdded
                          ? removeSection(section.id)
                          : addSection(course, section)
                      }
                      className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                        isAdded
                          ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          : "bg-red-700 text-white hover:bg-red-800"
                      }`}
                    >
                      {isAdded ? "Remove from schedule" : "Add to schedule"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {!loading && courses.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No courses match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
      {children}
    </span>
  );
}
