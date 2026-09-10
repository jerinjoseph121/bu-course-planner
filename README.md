# BU Course Planner

A web app for browsing Boston University courses and building a personal class schedule. Built as a personal project to explore the BU academic catalog and plan a semester's schedule.

## Features

### Course Navigator (`/courses`)

- Browse the full seeded BU course catalog (29 courses across 6 departments and 3 schools).
- Filter by:
  - Keyword search (course code, title, or description)
  - School (College of Arts & Sciences, Questrom School of Business, College of Engineering)
  - Department (Computer Science, Mathematics, Writing Program, Economics, etc.)
  - Level (Undergraduate / Graduate)
  - Credits
  - Meeting day (Monday–Friday)
- Each course shows its section(s) — type (Lecture/Discussion/Lab/Practicum/Seminar), meeting days/times, location, and instructor.
- "Add to schedule" on any section adds it straight to your Schedule Builder; if it's already on your schedule, the button switches to "Remove from schedule."

### Schedule Builder (`/schedule`)

- A Monday–Friday weekly grid (8 AM–10 PM) showing all your classes color-coded by course.
- Click any class block to edit it, or hover to reveal a quick delete (✕).
- "Add class" opens a form to add either:
  - A **class** (recurring weekly meeting — pick days, start/end time), or
  - An **exam** (a one-off date, for final exams and similar).
- Automatic **schedule conflict detection**: adding or editing a class that overlaps an existing one (same day, overlapping time) shows a warning, but doesn't block the save — you decide what to do with it.
- A separate **Exams** list below the grid for one-off dated entries (e.g. final exams), since those don't fit the recurring weekly grid.
- Full CRUD: every schedule entry can be read, added, updated, or deleted, whether it came from the catalog or was entered manually.

### Dashboard (`/`)

- At-a-glance stats (courses in catalog, departments, classes on your schedule).
- A summary of your current Fall 2026 classes and exams.

### Default schedule

The database seed pre-loads a Fall 2026 schedule derived from a real exported registrar calendar (`.ics`): CAS CS 598 (Advanced Topics in Computer Science: Distributed Systems — lecture + discussion sections), CAS CS 501 (CS Practicum), and its final exam slot. You can edit or delete any of these like any other schedule entry.

### AI Assistant (chat widget, every page)

A floating chat bubble (bottom-right) that answers questions about the course catalog, your current schedule, or general questions — it's a general-purpose assistant, not limited to courses. It can see the full catalog and your schedule on every message (so it can answer things like "what CS courses are on Tuesdays?" or "am I free at 2pm on Monday?").

It can also **change your schedule for you** through conversation — "add CAS CS 542", "drop my practicum", "swap my writing class for the econ one". For a clear request it just does it and confirms in one line. If a request would create a scheduling conflict, it adds it, points out exactly what it overlaps with, and asks how you'd like to resolve it (keep both / drop the other one / pick a different section) — it won't guess or silently remove anything. Any change it makes shows up immediately in the Course Navigator and Schedule Builder, live, without a page reload.

Powered by Google's free Gemini API. **Requires a free API key** to work — see [Setting up the AI assistant](#setting-up-the-ai-assistant) below. Without a key, the widget still opens but shows a clear "not configured" message instead of a reply.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, TypeScript) | One codebase for both the UI and the API (Route Handlers), server components for fast initial page loads, file-based routing. |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | Fast to iterate on layout/styling without leaving the component files. |
| Database | [SQLite](https://sqlite.org) via [Prisma ORM](https://www.prisma.io) | Zero external services to run locally; a single `dev.db` file holds the whole catalog + schedule; typed queries and migrations via Prisma. |
| Seed data | Hand-curated dataset (`prisma/seed.ts`) | The public BU academics site (bu.edu/academics) doesn't expose a stable, scrapeable course catalog API, so course data here is a realistic, representative sample rather than a live scrape — see [Known limitations](#known-limitations). |
| AI assistant | [Google Gemini API](https://ai.google.dev) (`gemini-3.6-flash` by default) | Free tier, no credit card required — a good fit for a personal project. Called directly via `fetch` (no SDK dependency) from a server-only Route Handler, so the API key never reaches the browser. |

No authentication — this is a single-user local planning tool. The only external API call at runtime is the AI assistant talking to Gemini.

## Project structure

```
prisma/
  schema.prisma       # Course, Section, ScheduleItem models
  seed.ts             # Seeds the course catalog + your default Fall 2026 schedule
src/
  app/
    page.tsx                    # Dashboard
    courses/page.tsx            # Course Navigator
    schedule/page.tsx           # Schedule Builder
    api/
      courses/route.ts          # GET /api/courses (search + filters)
      meta/route.ts             # GET /api/meta (filter dropdown options)
      schedule/route.ts         # GET/POST /api/schedule
      schedule/[id]/route.ts    # PUT/DELETE /api/schedule/:id
    api/assistant/route.ts      # POST /api/assistant (chat with the AI assistant)
  components/
    NavBar.tsx
    AssistantWidget.tsx          # Floating chat widget, rendered on every page
  lib/
    prisma.ts          # Prisma client singleton
    time.ts            # Day/time formatting + overlap detection helpers
    term.ts             # Shared "current term" constant
    gemini.ts           # Server-only Gemini API client, incl. the tool-calling loop
    assistantContext.ts # Builds the catalog + schedule system prompt sent to Gemini
    assistantTools.ts   # The tools the assistant can call (find/add/remove courses)
DESIGN.md              # Data model, API design, and key decisions
```

## Getting started

```bash
npm install
npx prisma migrate dev   # creates dev.db and runs the seed automatically
npm run dev
```

## Setting up the AI assistant

The chat widget needs a free Gemini API key:

1. Go to [ai.google.dev](https://ai.google.dev), sign in with a Google account, and create a free API key (Google AI Studio → "Get API key"). No credit card required.
2. Open `.env` in the project root and set:
   ```
   GEMINI_API_KEY="your-key-here"
   ```
3. Restart `npm run dev` if it was already running.

Without a key, the app still works fully — the chat widget just shows a message telling you it isn't configured yet instead of a reply.

Then open [http://localhost:3000](http://localhost:3000).

### Useful scripts

```bash
npm run dev        # start the dev server
npm run build       # production build
npm run db:seed     # re-run the seed script (re-seeds catalog, replaces the default Fall 2026 schedule)
npx prisma studio    # visual database browser
```

## Known limitations

- **Course data is curated, not live.** BU's public academics site doesn't offer a stable, scrapeable course catalog, so the 29 seeded courses are a realistic representative sample (mostly Computer Science, plus Math, Writing, Economics, Questrom, and Engineering) rather than the complete, live BU catalog. See `DESIGN.md` for how to extend this.
- **Single user, local only.** There's no login — the schedule in the database is "your" schedule. Fine for a personal tool; would need an auth layer to support multiple students.
- **Conflict detection is same-term only.** It compares weekly day/time overlaps within a term; it doesn't account for exam-period conflicts or cross-term scheduling.

See [`DESIGN.md`](./DESIGN.md) for the full data model, API design, and rationale behind these choices.
