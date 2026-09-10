# Design Document — BU Course Planner

## 1. Goal

Give a BU student one place to (a) browse and filter the course catalog, and (b) build and maintain a personal class schedule, seeded with their real Fall 2026 schedule.

## 2. Tech stack and rationale

**Next.js 16 (App Router, TypeScript, `src/` layout)** was chosen over a split frontend/backend setup because the app is small enough that a single codebase — server components for read-heavy pages, Route Handlers for the CRUD API — avoids the overhead of CORS, two deploys, and two dependency trees, while still giving a clean separation between UI (`src/app/**/page.tsx`) and API (`src/app/api/**/route.ts`).

**Prisma + SQLite** was chosen over local-storage-only or a hosted Postgres because:
- It gives real, typed CRUD (the "course builder" requirement) with a durable store that survives dev server restarts, without standing up an external database service.
- SQLite is a single file (`dev.db`); trivial to inspect (`npx prisma studio`), back up, or delete and reseed.
- If this ever needs to move to a hosted multi-device setup, swapping the `datasource` provider to Postgres is a small, well-trodden Prisma change — the schema and application code don't need to change.

**Tailwind CSS v4** (from the `create-next-app` scaffold) was kept as-is for styling — fast to iterate on without a separate CSS architecture.

## 3. Data model

Three Prisma models (`prisma/schema.prisma`):

```
Course 1---* Section 1---* ScheduleItem
```

- **`Course`** — one row per catalog course (`CAS CS 598`). Holds catalog metadata: title, description, school, department, credits, level, BU Hub units.
- **`Section`** — one row per specific offering of a course in a term (a lecture, a discussion, a lab). A course can have multiple sections with different meeting patterns — e.g. `CAS CS 598` has a lecture section (Tu/Th) and a separate discussion section (Mo), matching how it's actually taught. Each section has a single `days` + `startTime` + `endTime` + `location` — courses that meet at genuinely different times/places on different days (like CS 598 above) get multiple `Section` rows rather than one row trying to hold two meeting patterns.
- **`ScheduleItem`** — one row per entry on the student's personal schedule. This is intentionally **denormalized** rather than being a pure join table: it optionally references a `Section` (`sectionId`, set when added from the Course Navigator) but also carries its own `courseCode`/`title`/`days`/`startTime`/`endTime`/etc. This lets a student add a class that isn't in the seeded catalog at all (manual entry via the Schedule Builder's "Add class" form) using the exact same model and CRUD endpoints, instead of needing a separate "custom entry" table.
- **`kind`** on `ScheduleItem` distinguishes `"class"` (recurring weekly meeting, rendered on the grid) from `"exam"` (a one-off dated event, rendered in the separate Exams list). This was necessary because the student's real calendar export included a final exam as a specific date rather than a weekly-recurring pattern — trying to force that into the same `days`-based recurrence as regular classes would have been a worse fit than a small `kind` discriminator.

### Why not a `Meeting` join table for multi-day patterns?

An earlier draft had `Section` reference a separate `Meeting` table (one row per day) to support arbitrary meeting patterns. This was simplified to a single `days` string (comma-separated day codes, e.g. `"TU,TH"`) directly on `Section`/`ScheduleItem` once it became clear every real course meeting pattern here is "N days at the same single time," matching how BU (and most universities) actually publish sections — the extra join table would have added a table and query joins without buying any modeling power for cases that show up in practice.

## 4. API design

All routes live under `src/app/api/`:

| Route | Method | Purpose |
|---|---|---|
| `/api/courses` | GET | List courses. Query params: `q` (search code/title/description), `school`, `department`, `level`, `credits`, `day`, `term`. Includes each course's sections for the given term. |
| `/api/meta` | GET | Distinct filter values (schools, departments, levels, credits) for populating the Course Navigator's filter dropdowns, so the UI never hardcodes catalog values. |
| `/api/schedule` | GET | List all schedule items for a term. |
| `/api/schedule` | POST | Create a schedule item (from a catalog section, or a fully manual entry). Returns the created item **and** a `conflicts` array of any other schedule items whose day/time overlaps — the UI surfaces this as a warning without blocking the save, since a student may deliberately want to see and resolve a conflict rather than be blocked by it. |
| `/api/schedule/[id]` | PUT | Update a schedule item. Also returns `conflicts` after the update, for the same reason as POST. |
| `/api/schedule/[id]` | DELETE | Remove a schedule item. |
| `/api/assistant` | POST | Chat with the AI assistant. Body: `{ messages: [{role, content}, ...] }` (full conversation so far). Returns `{ reply }`, or a `{ error }` with status `501` if `GEMINI_API_KEY` isn't set, `502` if the Gemini call itself fails. |

Route Handlers use Next 16's `params: Promise<{ id: string }>` convention (confirmed against the Next.js docs shipped in `node_modules/next/dist/docs` for this exact installed version, since Next.js has changed this API across major versions).

### Conflict detection

`src/lib/time.ts` exports `meetingsOverlap(a, b)`: two weekly meeting patterns conflict if they share at least one day code and their `[startTime, endTime)` ranges overlap. This runs server-side on every POST/PUT against the student's other `"class"`-kind schedule items in the same term, so it works the same way whether a class was added from the Course Navigator or typed manually into the Schedule Builder form.

## 5. Frontend structure

- **`/` (Dashboard)** — a React Server Component that queries Prisma directly (no API round-trip needed, since it's a first-load read with no client interactivity) for summary stats and the current schedule.
- **`/courses` (Course Navigator)** — a client component. Filters are plain `useState`, refetched from `/api/courses` on change (the catalog is small — 29 rows — so there was no need for debouncing or pagination). Cross-references the current schedule (`/api/schedule`) so "Add to schedule" buttons correctly show "Remove from schedule" for sections already added.
- **`/schedule` (Schedule Builder)** — a client component rendering a CSS-grid weekly view (Mon–Fri × 8 AM–10 PM) with absolutely-positioned blocks per class, colored by a hash of the course code so the same course is visually consistent across the week. A modal form (shared for add and edit) handles both `"class"` and `"exam"` entries. A separate list below the grid handles exams, since they don't have a recurring weekly slot to render on the grid.

## 6. AI assistant

A floating chat widget (`AssistantWidget.tsx`, rendered from the root layout so it's on every page) that answers open-ended questions — about the course catalog, the student's own schedule, or anything else.

**Design choices:**

- **Provider: Google Gemini API**, chosen specifically because it has a genuinely free tier (no credit card required), which was a hard requirement — this app has no billing/usage-limiting of its own, so a free provider avoids ever putting the student on the hook for API costs from casually using their own planner.
- **Called via raw `fetch`, not the `@google/generative-ai` SDK.** The REST shape (`POST .../models/{model}:generateContent`) is simple enough that adding a dependency wasn't worth it, especially after this project's npm installs had already been a source of friction once — fewer dependencies, fewer things that can fail to install.
- **Stateless, context-stuffed, not RAG.** Every request rebuilds the full context (the entire course catalog + the student's current schedule, formatted as text) and sends it as the `systemInstruction`, along with the full conversation history as `contents` (`src/lib/assistantContext.ts`, `src/lib/gemini.ts`). There's no vector store or embedding search — with only 29 courses, the entire catalog fits comfortably in a single prompt, so retrieval infrastructure would be pure overhead. If the catalog grows into the hundreds of courses, this is the first thing that would need to change (to a real retrieval step, or at least filtering the catalog by the current conversation's topic before sending it).
- **Can modify the schedule, via Gemini function calling (tools).** The assistant isn't read-only — it can add a course section, remove a schedule entry, and look up exact course/section codes, through three tools defined in `src/lib/assistantTools.ts` and declared to Gemini in the `generateContent` request's `tools` field. `src/lib/gemini.ts` implements the agentic loop: send the conversation, and if the model's response contains `functionCall` parts instead of (or alongside) text, execute the corresponding tool server-side, feed the result back as a follow-up turn, and repeat (capped at `MAX_TOOL_ROUNDS = 6`) until the model responds with plain text.
- **Conflict handling is a conversation, not a form.** `add_course_section` always performs the add (it's non-destructive) and returns any conflicts it finds via the same `meetingsOverlap` check used by the manual UI. The system instruction tells the model to stop and discuss conflicts with the student — explain what overlaps, ask how to resolve it — rather than guessing or unilaterally removing the conflicting class. Only after the student says what they want does the model call `remove_course_from_schedule` (if that's the resolution). This mirrors how the Schedule Builder's own UI already treats conflicts (warn, don't block) rather than inventing a second, stricter policy for the chat path.
- **Tools use natural keys, not database IDs.** `add_course_section`/`remove_course_from_schedule` take `courseCode`/`sectionCode`/`type` (e.g. `"CAS CS 598"`, `"A1"`, `"Lecture"`) rather than Prisma's opaque `cuid` IDs. The model already has these natural keys in its context and conversation; making it track and repeat back internal database IDs would be needless surface area for it to get wrong. `remove_course_from_schedule` returns a list of candidates (without deleting) when a `courseCode` matches more than one schedule entry, so the model can ask the student to disambiguate instead of guessing which one to remove.
- **Live UI sync without a shared state store.** A successful mutating tool call sets `actionsTaken: true` on the `/api/assistant` response. `AssistantWidget.tsx` reacts to that by calling `router.refresh()` (revalidates server components, e.g. the Dashboard's stats) and dispatching a `window` `CustomEvent` (`SCHEDULE_CHANGED_EVENT`) that the Course Navigator and Schedule Builder pages listen for to refetch their client-side data. This was simpler than introducing a global state library (Zustand/Redux/React Query) for what's fundamentally "a few pages need to know the schedule changed" — verified live: adding a course through the chat widget while the Schedule Builder grid is open updates the grid immediately, no reload.
- **A live API quirk worth noting for future maintenance:** Gemini's documented function-calling examples (and this project's first draft) use `role: "function"` for the turn that carries a `functionResponse` back to the model. Against the actual deployed API for this project's model generation, that role is rejected (`400 Role 'function' is not supported`) — the accepted roles are `USER`/`MODEL` (among others), and a function response has to go back as `role: "user"`. This was only caught by testing live against the real API, not from documentation — if Gemini's API changes again, this is the first place to check.
- **API key handling.** `GEMINI_API_KEY` is read server-side only (`src/lib/gemini.ts`, used from the Route Handler) and is never sent to the browser. Without a key set, `/api/assistant` returns a `501` with an actionable message rather than the widget silently failing.
- **No conversation persistence.** Chat history lives only in the widget's React state (lost on page refresh). This was a reasonable simplification for a single-user tool where the schedule and catalog data is what needs to persist, not chat transcripts. Note this does mean a page refresh loses the model's memory of *why* it did something (e.g. "you told me to drop the writing class"), though the schedule state itself is durable since it's in the database.

## 7. Known limitations / future improvements

- **Seed data, not live BU data.** BU's public academics site (bu.edu/academics) does not expose a stable, machine-readable course catalog — what's browsable there is oriented around program/department pages, not a queryable course search API. Building a scraper against it would be fragile (subject to markup changes) and its terms of use weren't reviewed for this project. The pragmatic choice was a hand-curated seed dataset covering a representative slice of departments (Computer Science, Mathematics, Writing Program, Economics, Questrom, Engineering) with realistic course codes, titles, and meeting patterns — good enough to fully exercise the navigator's filters and the scheduler's CRUD and conflict detection. Swapping in real data later just means writing a different data source into `prisma/seed.ts` (or a one-off import script) — the schema and app code don't need to change.
- **Single user.** No auth; the schedule is global to the database, which is correct for "one student's own planner" but would need a `User` model and session auth to serve multiple students.
- **No drag-to-resize or drag-to-move on the weekly grid** — editing a class's time is done through the form, not by dragging the block. Could be added later with a library like `@dnd-kit` if that friction becomes a problem.
- **Assistant has no memory across page loads** (chat history is React state, lost on refresh), and it can only add/remove whole sections — it can't edit a manually-entered schedule item's fields (time, location) the way the Schedule Builder's edit form can. Both are addressable if needed — see [Section 6](#6-ai-assistant).
- **Assistant tool calls aren't rolled back on a later failure.** In the agentic loop, a mutating tool call (add/remove) commits to the database immediately; if a *later* step in the same turn fails (e.g. a transient Gemini API error), the mutation still happened even though the student never saw a confirmation. This matches how such assistants generally behave (the action already happened, only the narration failed) and was an acceptable tradeoff rather than building transactional rollback for a single-user tool — but it's worth knowing about if the schedule ever seems to have a change the chat didn't visibly confirm.
