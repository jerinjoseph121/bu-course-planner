"use client";

import { useEffect, useState } from "react";
import { DAY_SHORT, DayCode, formatTime, parseDays } from "@/lib/time";
import { SCHEDULE_CHANGED_EVENT } from "@/components/AssistantWidget";

type ScheduleItem = {
  id: string;
  kind: string;
  sectionId: string | null;
  courseCode: string;
  title: string;
  type: string | null;
  instructor: string | null;
  location: string | null;
  days: string;
  startTime: string;
  endTime: string;
  examDate: string | null;
  notes: string | null;
};

const DAYS: DayCode[] = ["MO", "TU", "WE", "TH", "FR"];
const GRID_START_MIN = 8 * 60; // 8:00
const GRID_END_MIN = 22 * 60; // 22:00
const PIXELS_PER_MIN = 1;

const COLORS = [
  "bg-red-100 border-red-300 text-red-900",
  "bg-blue-100 border-blue-300 text-blue-900",
  "bg-emerald-100 border-emerald-300 text-emerald-900",
  "bg-amber-100 border-amber-300 text-amber-900",
  "bg-purple-100 border-purple-300 text-purple-900",
  "bg-cyan-100 border-cyan-300 text-cyan-900",
];

function colorFor(courseCode: string) {
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) hash = (hash + courseCode.charCodeAt(i)) % COLORS.length;
  return COLORS[hash];
}

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const emptyForm = {
  courseCode: "",
  title: "",
  type: "Lecture",
  instructor: "",
  location: "",
  days: [] as DayCode[],
  startTime: "10:00",
  endTime: "10:50",
  kind: "class" as "class" | "exam",
  examDate: "",
  notes: "",
};

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    window.addEventListener(SCHEDULE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SCHEDULE_CHANGED_EVENT, refresh);
  }, []);

  function refresh() {
    setLoading(true);
    fetch("/api/schedule")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }

  const classes = items.filter((i) => i.kind === "class");
  const exams = items.filter((i) => i.kind === "exam");

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(item: ScheduleItem) {
    setForm({
      courseCode: item.courseCode,
      title: item.title,
      type: item.type ?? "Lecture",
      instructor: item.instructor ?? "",
      location: item.location ?? "",
      days: parseDays(item.days),
      startTime: item.startTime,
      endTime: item.endTime,
      kind: item.kind as "class" | "exam",
      examDate: item.examDate ?? "",
      notes: item.notes ?? "",
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function submitForm() {
    setMessage(null);
    const payload = {
      courseCode: form.courseCode,
      title: form.title,
      type: form.type,
      instructor: form.instructor || null,
      location: form.location || null,
      days: form.kind === "class" ? form.days.join(",") : "",
      startTime: form.startTime,
      endTime: form.endTime,
      kind: form.kind,
      examDate: form.kind === "exam" ? form.examDate : null,
      notes: form.notes || null,
    };

    const res = editingId
      ? await fetch(`/api/schedule/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Something went wrong.");
      return;
    }
    if (data.conflicts?.length) {
      setMessage(
        `Saved — but this overlaps with ${data.conflicts
          .map((c: { title: string }) => c.title)
          .join(", ")}.`
      );
    } else {
      setMessage("Schedule updated.");
    }
    setShowForm(false);
    refresh();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    refresh();
  }

  function toggleDay(d: DayCode) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Schedule Builder
          </h1>
          <p className="mt-1 text-slate-600">
            Your Fall 2026 weekly schedule. Add, edit, or remove classes and
            exams.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
        >
          + Add class
        </button>
      </div>

      {message && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <WeekGrid items={classes} onEdit={openEditForm} onDelete={deleteItem} />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Exams</h2>
            {exams.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No exams logged.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {exams.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium text-slate-900">
                        {item.courseCode}
                      </span>{" "}
                      — {item.title} · {item.examDate}{" "}
                      {item.startTime && item.startTime !== item.endTime
                        ? `· ${formatTime(item.startTime)}–${formatTime(item.endTime)}`
                        : ""}
                      {item.notes && (
                        <div className="text-xs text-slate-500">{item.notes}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(item)}
                        className="text-xs font-medium text-slate-500 hover:text-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Edit entry" : "Add a class or exam"}
            </h2>

            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                {(["class", "exam"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setForm((f) => ({ ...f, kind: k }))}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
                      form.kind === k
                        ? "bg-red-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <Field label="Course code">
                <input
                  className="input"
                  value={form.courseCode}
                  onChange={(e) => setForm((f) => ({ ...f, courseCode: e.target.value }))}
                  placeholder="CAS CS 501"
                />
              </Field>
              <Field label="Title">
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="CS Practicum"
                />
              </Field>
              <Field label="Type">
                <input
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  placeholder="Lecture / Discussion / Practicum / Exam"
                />
              </Field>

              {form.kind === "class" ? (
                <>
                  <Field label="Days">
                    <div className="flex gap-2">
                      {DAYS.map((d) => (
                        <button
                          key={d}
                          onClick={() => toggleDay(d)}
                          className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                            form.days.includes(d)
                              ? "bg-red-700 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {DAY_SHORT[d]}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start time">
                      <input
                        type="time"
                        className="input"
                        value={form.startTime}
                        onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      />
                    </Field>
                    <Field label="End time">
                      <input
                        type="time"
                        className="input"
                        value={form.endTime}
                        onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      />
                    </Field>
                  </div>
                </>
              ) : (
                <Field label="Exam date">
                  <input
                    type="date"
                    className="input"
                    value={form.examDate}
                    onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                  />
                </Field>
              )}

              <Field label="Location">
                <input
                  className="input"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="CAS 214"
                />
              </Field>
              <Field label="Instructor">
                <input
                  className="input"
                  value={form.instructor}
                  onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
                  placeholder="Prof. D. Whitcomb"
                />
              </Field>
              <Field label="Notes">
                <textarea
                  className="input"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
              >
                {editingId ? "Save changes" : "Add to schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function WeekGrid({
  items,
  onEdit,
  onDelete,
}: {
  items: ScheduleItem[];
  onEdit: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
}) {
  const hourMarks: number[] = [];
  for (let m = GRID_START_MIN; m <= GRID_END_MIN; m += 60) hourMarks.push(m);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid min-w-[720px] grid-cols-[64px_repeat(5,1fr)]">
        <div className="border-b border-slate-200" />
        {DAYS.map((d) => (
          <div
            key={d}
            className="border-b border-l border-slate-200 py-2 text-center text-sm font-semibold text-slate-700"
          >
            {DAY_SHORT[d]}
          </div>
        ))}

        <div className="relative" style={{ height: (GRID_END_MIN - GRID_START_MIN) * PIXELS_PER_MIN }}>
          {hourMarks.map((m) => (
            <div
              key={m}
              className="absolute right-1 -translate-y-1/2 text-[10px] text-slate-400"
              style={{ top: (m - GRID_START_MIN) * PIXELS_PER_MIN }}
            >
              {formatTime(`${Math.floor(m / 60)}:00`)}
            </div>
          ))}
        </div>

        {DAYS.map((d) => (
          <div
            key={d}
            className="relative border-l border-slate-100"
            style={{ height: (GRID_END_MIN - GRID_START_MIN) * PIXELS_PER_MIN }}
          >
            {hourMarks.map((m) => (
              <div
                key={m}
                className="absolute left-0 right-0 border-t border-slate-100"
                style={{ top: (m - GRID_START_MIN) * PIXELS_PER_MIN }}
              />
            ))}
            {items
              .filter((i) => parseDays(i.days).includes(d))
              .map((item) => {
                const start = toMinutes(item.startTime);
                const end = toMinutes(item.endTime);
                const top = (start - GRID_START_MIN) * PIXELS_PER_MIN;
                const height = Math.max((end - start) * PIXELS_PER_MIN, 28);
                return (
                  <button
                    key={item.id + d}
                    onClick={() => onEdit(item)}
                    className={`group absolute left-0.5 right-0.5 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm ${colorFor(item.courseCode)}`}
                    style={{ top, height }}
                    title="Click to edit"
                  >
                    <div className="font-semibold">{item.courseCode}</div>
                    <div className="truncate">{item.type}</div>
                    <div className="truncate">
                      {formatTime(item.startTime)}–{formatTime(item.endTime)}
                    </div>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="absolute right-1 top-1 hidden rounded bg-white/70 px-1 text-[10px] font-bold text-red-700 group-hover:block"
                    >
                      ✕
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
