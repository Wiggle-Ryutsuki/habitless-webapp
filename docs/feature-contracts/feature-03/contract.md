# Feature 3 Engineering Contract: Daily Habit Tracker Calendar Desktop Grid, In-Calendar Edit & Goals Tracker

**Feature ID**: FEATURE-HL-03  
**Target Branch**: `feature/3-calendar-goals`  
**Base Branch**: `staging` (or `feature/2-habit-checklist`)  
**Status**: Approved Specification Baseline (Unified Habit Calendar Architecture)  
**Version**: 1.0  
**Sprint Alignment**: Sprint 1 (MVP Increment 3 of 4, v1.5 Specifications)  
**Parent Specifications**:  
- [`docs/sprint-01/specification.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/specification.md)  
- [`docs/sprint-01/api-spec.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/api-spec.md)  
- [`docs/sprint-01/ui-spec.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/ui-spec.md)  
- [`docs/sprint-01/tests.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/tests.md)  
- [`docs/sprint-01/_lab5_sec31_habitless.pdf`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/_lab5_sec31_habitless.pdf)  

---

## 1. Purpose, Scope, and Explicit Exclusions

### 1.1. Purpose & Deliverables
Feature 3 delivers the comprehensive desktop habit visualization, multi-day tracking, habit modification, and personal reflection capabilities for participants in HabitLess. It completes the unified **Daily Habit Tracker Calendar Desktop** (`/calendar`) specified in `_lab5_sec31_habitless.pdf` (p. 3), building directly upon the daily checklist and habit foundations established in Feature 2.

In this architecture, daily habit tracking and the monthly calendar desktop are **unified on a single screen** (`/calendar`). Feature 3 elevates this screen from a single-day illuminated column into a full-fidelity monthly management matrix:

1. **Full 1–31 Monthly Grid Matrix**:
   - Habits rendered as table rows; days of the month (1–31 depending on month length) rendered as grid columns labeled with day-of-week initials (`M T W T F S S`) and day numbers.
   - Month/Year selector (`< March 2021 >`) allowing navigation across historical and current months.
   - Top illuminated date column (`aria-current="date"`) highlighting the current calendar date.
   - Interactive cell toggles allowing participants to log or uncheck completions across both past days of the month and the current illuminated day.
   - Each completed day cell renders an interactive pill filled with the habit's assigned color (from the 8 fixed habit palette tokens) displaying a high-contrast white checkmark glyph (`✓`).
2. **In-Calendar Habit Editing (`Screen 4`)**:
   - An inline `[Edit]` button on each habit row within the sticky `HABITS` column opens the "Edit Habit" modal dialog.
   - Allows participants to edit Habit Title (2–80 chars), Description (optional, max 500 chars), Color (8 circular palette swatches), Frequency rule, Start Date, End Date, and Monthly Target Count (1–31).
   - Backed by the REST endpoint `PUT /api/habits/:id` with real-time UI grid update upon save.
3. **Right-Column Goals Tracker (`GOAL ACHIEVED`)**:
   - Dedicated sticky right column on the calendar grid displaying each habit's monthly target count alongside its achieved completion count for the selected month (e.g., `20 / 19` or `20 [ 19 ]`).
   - Dynamically recalculates in real time whenever cells are toggled or habit target counts are modified.
   - Backed by `GET /api/tracking/calendar` and standalone `GET /api/tracking/goals`.
4. **Bottom Notes Section**:
   - Reflection area situated directly below the 1–31 calendar matrix displaying timestamped participant notes.
   - Inline/modal `+ New Note` creation flow capturing reflection text (1–1000 chars), note date (`YYYY-MM-DD`), and optional associated `habitId`.
   - Backed by `GET /api/tracking/notes` and `POST /api/tracking/notes`.

---

### 1.2. Explicit Exclusions (Strict Scope Boundary)

To maintain a strict MVP boundary and prevent scope creep:
* **Excluded Feature 1 Capabilities (Auth & Infrastructure)**:
  - User registration, login/logout, password hashing, session tokens, and health probes (`GET /api/health`, `GET /api/ready`) are assumed functional and merged from Feature 1 (`feature/1-auth-roles`).
* **Excluded Feature 2 Baseline Capabilities (Already Implemented)**:
  - Initial `Habit` and `HabitLog` relational models, `POST /api/habits` creation modal, `GET /api/tracking/today` side habits checklist, single-day illuminated column toggle via `POST /api/tracking/log`, and the Dashboard under-construction placeholder (`/dashboard` with notification popup) are assumed functional and merged from Feature 2 (`feature/2-habit-checklist`).
* **Excluded Feature 4 Capabilities (Program Manager Challenges)**:
  - Program Manager Challenge Program builder (`/manager`, `Screen 5`).
  - Standardized activity definitions and web deployment/invitation link generation (`PUT /api/manager/programs/:id/deploy`).
  - Public challenge preview (`/challenges/:id`, `Screen 6`) and participant enrollment (`POST /api/challenges/:id/join`).
* **Excluded Non-MVP & Deferred Capabilities (Post-Sprint 1 per `_lab5_sec31_habitless.pdf`, pp. 4–5)**:
  - Separate Completion Calendar / Heatmap (dedicated separate monthly heatmap grid) — High Priority / High Effort.
  - Per-habit statistical dashboards, completion percentage pie charts, and trend line graphs — High Priority / High Effort.
  - Program Completion Bar (aggregate progress bar for "Total Habits Done") — High Priority / High Effort.
  - Separate detached habits management page (habit management is strictly unified within `/calendar`) — High Priority / High Effort.
  - Challenge packages marketplace catalog (`See new challenge packages ...`) — High Priority / High Effort.
  - Manager active roster participant removal and deactivation — High Priority / High Effort.
  - Manager challenge and category popularity analytics — High Priority / High Effort.
  - Arbitrary hex color pickers (only the 8 fixed habit palette swatches are selectable) — Low Priority / Low Effort.
  - Habit streaks, highest streak counters, and gamification trophies — Low Priority / Low Effort.
  - Daily mood tracker calendar — Low Priority / High Effort.
  - Email or SMS reminder notification pipeline — Low Priority / High Effort.
  - One-click CSV log export — Low Priority / High Effort.
  - Bug report feedback form — Low Priority / Low Effort.

---

## 2. Requirements Traceability Matrix

| Requirement / Rule / AC | Description | Implementation Target in Feature 3 |
| :--- | :--- | :--- |
| **FR-09** | Calendar Desktop Grid | Full 1–31 monthly grid matrix on `/calendar` with sticky `HABITS` column, day-of-week initials (`M T W T F S S`), illuminated active date column, and interactive color-coded checkmarks (`Screen 2`, `UI-04`, `API-10`). |
| **FR-10** | In-Calendar Habit Edit | Inline `[Edit]` button on calendar habit rows opening Edit Modal; updating Title, Description, Color, Frequency, Dates, and Target Count (`Screen 4`, `UI-05`, `API-08`). |
| **FR-11** | Goals Tracker | Right column (`GOAL ACHIEVED`) displaying target count alongside achieved completion count (`target / achieved`); aggregate endpoint `GET /api/tracking/goals` and calculation utility `goals.ts` (`Screen 2`, `UT-04`, `API-10`). |
| **FR-12** | Calendar Notes Section | Reflection feed below calendar grid displaying timestamped cards and `+ New Note` submission action (`Screen 2`, `UI-06`, `API-11`). |
| **BR-01** | Participant Data Isolation | All queries scoped by authenticated user (`req.user.id`). Cross-user habit edit or note linking returns HTTP 404 (`HABIT_NOT_FOUND`) or 403 Forbidden. `PROGRAM_MANAGER` tokens return HTTP 403 Forbidden on all `/api/tracking/*` routes. |
| **BR-02** | 8-Color Fixed Habit Palette Restriction | Habit colors must strictly match one of the 8 fixed habit tokens (`#448aff`, `#1565c0`, `#009688`, `#8bc34a`, `#ffc107`, `#ff9800`, `#f44336`, `#ad1457`) or `#RRGGBBff`. Non-palette colors rejected with HTTP 422. |
| **BR-03** | Habit Name Constraints | Required, trimmed string, 2–80 characters. Enforced on `PUT /api/habits/:id`. |
| **BR-04** | Description Constraints | Optional multiline text, maximum 500 characters. Enforced on `PUT /api/habits/:id`. |
| **BR-05** | Date Range Invariant | `endDate >= startDate`. Inverted dates rejected with HTTP 422. |
| **BR-06** | Idempotent Daily Logging | Matrix cell clicks reuse `POST /api/tracking/log` on `(habitId, logDate)`. Uniqueness constraint `@@unique([habitId, logDate])` ensures idempotency. Future dates beyond tomorrow rejected with HTTP 422. |
| **AC-06** | Habit Calendar Desktop & Goals Column | Renders days 1–31 labeled with day-of-week initials (`M T W T F S S`), illuminated today column, checkmarks in habit colors, and right column target vs. achieved tally (`20 / 19`). Clicking Dashboard link displays "Dashboard is still under construction" popup. |
| **AC-07** | In-Calendar Habit Editing | Clicking `[Edit]` opens modal pre-populated with existing habit data; saving persists changes via `PUT /api/habits/:id` and immediately updates the calendar row and goals counter. |
| **AC-08** | Calendar Notes Section & `+ New Note` | Clicking `+ New Note` allows entry of reflection text (max 1000 chars) with date; saves via `POST /api/tracking/notes` and displays timestamped note card in feed below grid. |

---

## 3. Data Design & Idempotent Seed Requirements

### 3.1. Prisma Schema Evolution (`server/prisma/schema.prisma`)
Feature 3 introduces the `DailyNote` model for timestamped reflection notes and extends relations on `User` and `Habit`, while utilizing the existing `Habit` (`targetCount`, `colorHex`, `frequency`) and `HabitLog` models created in Feature 2:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  PARTICIPANT
  PROGRAM_MANAGER
}

enum FrequencyType {
  DAILY
  WEEKDAYS
  THREE_TIMES_WEEKLY
  WEEKLY
  MONTHLY
  CUSTOM_DAYS
}

model User {
  id           Int           @id @default(autoincrement())
  email        String        @unique
  passwordHash String
  fullName     String
  role         Role          @default(PARTICIPANT)
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  habits       Habit[]
  dailyNotes   DailyNote[]

  @@map("users")
}

model Habit {
  id           Int           @id @default(autoincrement())
  userId       Int
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  colorHex     String        @default("#448aff")
  frequency    FrequencyType @default(DAILY)
  daysOfWeek   Int[]         // [1,2,3,4,5] for weekdays (1=Mon..7=Sun)
  startDate    DateTime      @default(now())
  endDate      DateTime?
  targetCount  Int           @default(20) // Monthly target count (1–31)
  isActive     Boolean       @default(true)
  programId    Int?          // Reserved for Feature 4 challenge program link
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  logs         HabitLog[]
  notes        DailyNote[]

  @@index([userId])
  @@index([startDate, endDate])
  @@map("habits")
}

model HabitLog {
  id           Int       @id @default(autoincrement())
  habitId      Int
  habit        Habit     @relation(fields: [habitId], references: [id], onDelete: Cascade)
  logDate      DateTime  @db.Date
  completed    Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([habitId, logDate])
  @@index([habitId])
  @@index([logDate])
  @@map("habit_logs")
}

model DailyNote {
  id           Int       @id @default(autoincrement())
  userId       Int
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  habitId      Int?
  habit        Habit?    @relation(fields: [habitId], references: [id], onDelete: SetNull)
  noteDate     DateTime  @db.Date
  content      String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId, noteDate])
  @@map("daily_notes")
}
```

#### Relational Invariants & Integrity Constraints:
1. **User Isolation on Daily Notes**: Each `DailyNote` belongs directly to a `User` (`userId`), guaranteeing that reflection notes are strictly private.
2. **Optional Habit Linkage**: `DailyNote.habitId` is nullable with `onDelete: SetNull`. If a habit is soft-archived or hard-deleted, associated notes persist as general date reflections.
3. **Database Date Truncation**: `noteDate` is typed `@db.Date` in PostgreSQL, storing pure UTC calendar dates without timezone offset drift.
4. **Target Count Invariant**: `Habit.targetCount` represents the monthly target completions (integer between 1 and 31, default 20).

---

### 3.2. Idempotent Seed Requirements (`server/prisma/seed.ts`)
The seed script must idempotently populate multi-day logs and reflection notes for Demo Participant `participant1@habitless.internal` (`Alex Rivera`) so the 1–31 desktop grid and goals column render realistic, rich data immediately upon initial launch.

```typescript
// 1. Participant 1 Sample Habits (Aligned with _lab5_sec31_habitless.pdf, p. 3 mockup)
const demoHabits = [
  { title: 'Journal', colorHex: '#ff9800', frequency: 'DAILY', targetCount: 20 },
  { title: 'Exercise', colorHex: '#448aff', frequency: 'DAILY', targetCount: 20 },
  { title: 'Bathe + Moisturize', colorHex: '#009688', frequency: 'DAILY', targetCount: 25 },
  { title: 'Eat a healthy breakfast', colorHex: '#8bc34a', frequency: 'DAILY', targetCount: 20 },
  { title: 'No alcohol', colorHex: '#f44336', frequency: 'DAILY', targetCount: 20 },
  { title: 'No concentrated sugar', colorHex: '#ad1457', frequency: 'DAILY', targetCount: 20 },
  { title: 'Eat a light dinner', colorHex: '#ffc107', frequency: 'DAILY', targetCount: 20 },
  { title: 'Sleep for 7.5 hrs', colorHex: '#1565c0', frequency: 'DAILY', targetCount: 25 },
];

// 2. Multi-Day Completion Logs (Days 1–18 of Current Month)
// Idempotently upsert completion logs across past days to populate goal achieved counters (e.g. Journal: 19/20, Exercise: 14/20)
for (const day of [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]) {
  const logDate = new Date(Date.UTC(currentYear, currentMonthIndex, day));
  await prisma.habitLog.upsert({
    where: { habitId_logDate: { habitId: journalHabit.id, logDate } },
    update: { completed: true },
    create: { habitId: journalHabit.id, logDate, completed: true }
  });
}

// 3. Sample Reflection Notes (DailyNote entries below calendar)
const sampleNotes = [
  {
    noteDate: new Date(Date.UTC(currentYear, currentMonthIndex, 18)),
    content: "I gotta make sure I don't let my alcohol intake get regular again.",
    habitTitle: 'No alcohol'
  },
  {
    noteDate: new Date(Date.UTC(currentYear, currentMonthIndex, 17)),
    content: "Great energy after morning exercise and nutritious breakfast.",
    habitTitle: 'Exercise'
  }
];

for (const note of sampleNotes) {
  const habit = seededHabits.find(h => h.title === note.habitTitle);
  const existingNote = await prisma.dailyNote.findFirst({
    where: { userId: participant1.id, noteDate: note.noteDate, content: note.content }
  });
  if (!existingNote) {
    await prisma.dailyNote.create({
      data: {
        userId: participant1.id,
        habitId: habit?.id ?? null,
        noteDate: note.noteDate,
        content: note.content
      }
    });
  }
}
```

---

## 4. API Specification & RBAC Endpoints

All endpoints require JWT Bearer authentication or session cookie. Unauthenticated calls return `401 Unauthorized`. `PROGRAM_MANAGER` tokens calling `/api/tracking/*` or `/api/habits/*` return `403 Forbidden`. Cross-user access returns `404 Not Found` (or `403 Forbidden`) to prevent resource enumeration.

### 4.1. Standard Error Envelope
All error responses adhere strictly to the project-standard JSON envelope:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed for one or more fields.",
  "fieldErrors": [
    {
      "field": "targetCount",
      "message": "Monthly target count must be an integer between 1 and 31."
    }
  ],
  "correlationId": "req-c3d5e7f9-20261113"
}
```

---

### 4.2. In-Calendar Habit Update (`PUT /api/habits/:id`)
Updates an existing habit directly from the calendar row's `[Edit]` button.

* **Path**: `PUT /api/habits/:id`
* **Method**: `PUT`
* **Access**: Authenticated (`PARTICIPANT` owner).
* **URL Parameters**:
  * `id` (integer, required): ID of the habit to update.
* **Request Body**:
```json
{
  "title": "Journal & Reflection",
  "description": "Evening gratitude and daily retrospective",
  "colorHex": "#ff9800",
  "frequency": "DAILY",
  "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
  "startDate": "2026-03-01T00:00:00.000Z",
  "endDate": null,
  "targetCount": 22
}
```
* **Validation Rules**:
  * `title`: required string, trimmed, 2–80 characters.
  * `description`: optional string, maximum 500 characters.
  * `colorHex`: required string, must match one of the 8 fixed habit palette tokens (`#448aff`, `#1565c0`, `#009688`, `#8bc34a`, `#ffc107`, `#ff9800`, `#f44336`, `#ad1457`) or `#RRGGBBff`. Non-palette colors return `422 Unprocessable Entity` (`INVALID_HABIT_COLOR`).
  * `frequency`: required enum (`DAILY`, `WEEKDAYS`, `THREE_TIMES_WEEKLY`, `WEEKLY`, `MONTHLY`, `CUSTOM_DAYS`).
  * `daysOfWeek`: array of integers (1=Monday through 7=Sunday).
  * `startDate`: valid ISO date string.
  * `endDate`: optional ISO date string. If present, `endDate >= startDate` must hold; otherwise returns `422 Unprocessable Entity` (`INVALID_DATE_RANGE`).
  * `targetCount`: optional integer between 1 and 31 (default 20).
* **Response `200 OK`**:
```json
{
  "id": 101,
  "userId": 1,
  "title": "Journal & Reflection",
  "description": "Evening gratitude and daily retrospective",
  "colorHex": "#ff9800",
  "frequency": "DAILY",
  "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
  "startDate": "2026-03-01T00:00:00.000Z",
  "endDate": null,
  "targetCount": 22,
  "isActive": true,
  "createdAt": "2026-03-01T10:00:00.000Z",
  "updatedAt": "2026-03-18T14:30:00.000Z"
}
```
* **Status Codes**:
  * `200 OK`: Habit updated successfully.
  * `400 Bad Request`: Malformed JSON or invalid path parameter ID.
  * `401 Unauthorized`: Missing or invalid authentication token.
  * `403 Forbidden`: User has `PROGRAM_MANAGER` role.
  * `404 Not Found`: Habit does not exist or belongs to another user (`HABIT_NOT_FOUND`).
  * `422 Unprocessable Entity`: Validation failure on title length, colorHex palette, date range invariant, or targetCount bounds.

---

### 4.3. Calendar Matrix Retrieval (`GET /api/tracking/calendar`)
Retrieves the complete monthly habit tracking matrix for the desktop calendar grid matching `_lab5_sec31_habitless.pdf`, p. 3.

* **Path**: `GET /api/tracking/calendar`
* **Method**: `GET`
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**:
  * `month` (required integer, 1–12): Calendar month (e.g., `3` for March).
  * `year` (required integer, 4-digit): Calendar year (e.g., `2021` or `2026`).
* **Validation Rules**:
  * If `month` is missing or outside 1–12, returns `400 Bad Request`.
  * If `year` is missing or not a 4-digit integer (e.g. 1900–2100), returns `400 Bad Request`.
  * `dayInitials`: The API returns an array of length equal to `daysInMonth` (28–31 initials matching each specific day of the month: e.g. `["M", "T", "W", "T", "F", "S", "S", "M", ...]`). Index `i` matches day number `i + 1`.
* **Response `200 OK`**:
```json
{
  "month": 3,
  "year": 2021,
  "daysInMonth": 31,
  "dayInitials": [
    "M", "T", "W", "T", "F", "S", "S",
    "M", "T", "W", "T", "F", "S", "S",
    "M", "T", "W", "T", "F", "S", "S",
    "M", "T", "W", "T", "F", "S", "S",
    "M", "T", "W"
  ],
  "habits": [
    {
      "habitId": 101,
      "title": "Journal",
      "colorHex": "#ff9800",
      "targetCount": 20,
      "goalAchievedCount": 19,
      "days": {
        "1": true,
        "2": true,
        "3": true,
        "4": false,
        "5": true,
        "18": true,
        "26": true,
        "27": false
      }
    },
    {
      "habitId": 102,
      "title": "Exercise",
      "colorHex": "#448aff",
      "targetCount": 20,
      "goalAchievedCount": 14,
      "days": {
        "1": true,
        "2": false,
        "3": true,
        "18": true
      }
    }
  ]
}
```
* **Status Codes**:
  * `200 OK`: Matrix successfully returned.
  * `400 Bad Request`: Invalid or missing `month` or `year` query parameters.
  * `401 Unauthorized`: Missing or invalid credentials.
  * `403 Forbidden`: Role is `PROGRAM_MANAGER`.
  * `500 Internal Server Error`: Server database query failure.

---

### 4.4. Monthly Goals Tracker Overview (`GET /api/tracking/goals`)
Provides aggregated monthly goals progress per habit.

* **Path**: `GET /api/tracking/goals`
* **Method**: `GET`
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**:
  * `month` (optional integer, 1–12, defaults to current month).
  * `year` (optional integer, 4-digit, defaults to current year).
* **Response `200 OK`**:
```json
{
  "activeHabitsCount": 8,
  "totalGoalsAchievedThisMonth": 128,
  "habitsSummary": [
    { "habitId": 101, "title": "Journal", "target": 20, "achieved": 19 },
    { "habitId": 102, "title": "Exercise", "target": 20, "achieved": 14 },
    { "habitId": 103, "title": "Bathe + Moisturize", "target": 25, "achieved": 19 },
    { "habitId": 104, "title": "Eat a healthy breakfast", "target": 20, "achieved": 20 },
    { "habitId": 105, "title": "No alcohol", "target": 20, "achieved": 20 },
    { "habitId": 106, "title": "No concentrated sugar", "target": 20, "achieved": 16 },
    { "habitId": 107, "title": "Eat a light dinner", "target": 20, "achieved": 21 },
    { "habitId": 108, "title": "Sleep for 7.5 hrs", "target": 25, "achieved": 11 }
  ]
}
```
* **Status Codes**:
  * `200 OK`: Goals summary successfully returned.
  * `400 Bad Request`: Invalid or malformed `month` or `year` query parameters.
  * `401 Unauthorized`: Missing or invalid authentication token.
  * `403 Forbidden`: User has `PROGRAM_MANAGER` role.
  * `500 Internal Server Error`: Server database query failure.

---

### 4.5. Multi-Day Cell Toggles (`POST /api/tracking/log`)
Feature 3 reuses the idempotent daily logging endpoint from Feature 2 to handle cell clicks across any past day or current day in the 1–31 grid.

* **Path**: `POST /api/tracking/log`
* **Method**: `POST`
* **Access**: Authenticated (`PARTICIPANT`).
* **Request Body**:
```json
{
  "habitId": 101,
  "date": "2021-03-15",
  "completed": true
}
```
* **Behavior & Idempotency Rules**:
  * If `completed: true`: Upserts `HabitLog` for `(habitId, date)` with `completed = true`.
  * If `completed: false`: Deletes the `HabitLog` entry or sets `completed = false`.
  * **Future-Date Boundary**: Dates beyond tomorrow (`date > tomorrow UTC`) are rejected with `422 Unprocessable Entity` (`CANNOT_LOG_FUTURE_DATE`).
  * **Ownership Barrier**: `habitId` must belong to `req.user.id`. Cross-user logging returns `404 Not Found` (`HABIT_NOT_FOUND`).

---

### 4.6. Reflection Notes Endpoints

#### `GET /api/tracking/notes`
Lists all reflection notes created by the authenticated participant.

* **Path**: `GET /api/tracking/notes`
* **Method**: `GET`
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**:
  * `month` (optional integer, 1–12): Filter notes by month.
  * `year` (optional integer, 4-digit): Filter notes by year.
  * `habitId` (optional integer): Filter notes linked to a specific habit.
* **Response `200 OK`**:
```json
[
  {
    "id": 1,
    "habitId": 105,
    "habitTitle": "No alcohol",
    "noteDate": "2021-03-18",
    "timestamp": "2021-03-18T21:00:00.000Z",
    "content": "I gotta make sure I don't let my alcohol intake get regular again."
  },
  {
    "id": 2,
    "habitId": 102,
    "habitTitle": "Exercise",
    "noteDate": "2021-03-17",
    "timestamp": "2021-03-17T21:00:00.000Z",
    "content": "Great energy after morning meditation and workout."
  }
]
```

#### `POST /api/tracking/notes`
Creates a new timestamped reflection note via the `+ New Note` action located below the calendar.

* **Path**: `POST /api/tracking/notes`
* **Method**: `POST`
* **Access**: Authenticated (`PARTICIPANT`).
* **Request Body**:
```json
{
  "noteDate": "2021-03-18",
  "content": "I gotta make sure I don't let my alcohol intake get regular again.",
  "habitId": 105
}
```
* **Validation Rules**:
  * `noteDate`: required string formatted `YYYY-MM-DD`. Must be a valid calendar date.
  * `content`: required string, trimmed, length 1–1000 characters. Empty or whitespace-only strings rejected with `422 Unprocessable Entity`.
  * `habitId`: optional integer. If provided, must reference an active or archived habit owned by `req.user.id`. Linking another participant's habit returns `404 Not Found` (`HABIT_NOT_FOUND`).
* **Response `201 Created`**:
```json
{
  "id": 3,
  "habitId": 105,
  "habitTitle": "No alcohol",
  "noteDate": "2021-03-18",
  "timestamp": "2021-03-18T21:30:00.000Z",
  "content": "I gotta make sure I don't let my alcohol intake get regular again."
}
```
* **Status Codes**:
  * `201 Created`: Note recorded successfully.
  * `400 Bad Request`: Malformed JSON or invalid date format.
  * `401 Unauthorized`: Unauthenticated request.
  * `403 Forbidden`: `PROGRAM_MANAGER` role.
  * `404 Not Found`: Linked `habitId` does not belong to authenticated user.
  * `422 Unprocessable Entity`: `content` length outside 1–1000 characters.

---

## 5. UI Specification & Visual Design Tokens

### 5.1. Decoupled Color Systems
Per `ui-spec.md` Section 1, HabitLess strictly decouples the **Website Theme Palette** from the **Habit Colors Palette**:

```
+-----------------------------------------------------------------------------------------+
|                                WEBSITE THEME PALETTE                                   |
|   Used for application chrome, navigation, cards, borders, typography, background       |
|                                                                                         |
|   --walnut: #724319       --light-coral: #d88180    --powder-blush: #f7b1b0            |
|   --papaya-whip: #feeac7  --golden-sand: #cad182                                        |
+-----------------------------------------------------------------------------------------+
|                                8 FIXED HABIT COLOR TOKENS                               |
|   Used for habit row strips, color swatches, matrix checkmark pills, and goal badges    |
|                                                                                         |
|   --blue-energy:  #448aff    --ocean-deep:    #1565c0    --verdigris:   #009688         |
|   --yellow-green: #8bc34a    --amber-gold:    #ffc107    --amber-glow:  #ff9800         |
|   --cinnabar:     #f44336    --cherry-rose:   #ad1457                                   |
+-----------------------------------------------------------------------------------------+
```

1. **Website Theme Tokens**:
   - Canvas background: Powder Blush (`#f7b1b0`).
   - Header, navigation bar, primary buttons, and headings: Walnut (`#724319`).
   - Cards, modals, and container surfaces: Clean white (`#ffffff`) or light tint on Powder Blush canvas.
   - Borders and dividers: Papaya Whip (`#feeac7`) for card borders, soft dividers, and table row hover highlights; subtle Walnut (`rgba(114, 67, 25, 0.15)`) for structural borders.
   - Illuminated active date column: Highlighted border (`#724319` 2px solid) with subtle glowing background (`rgba(202, 209, 130, 0.25)` or Light Coral tint).
2. **8 Fixed Habit Color Tokens**:
   - Each habit row has a distinct assigned color selected exclusively from the 8 tokens.
   - Completed matrix cells display an oval/pill background matching the habit's hex with a white bold checkmark `✓`.
   - Pending/missed cells display a neutral hollow border (`#d88180` or subtle gray `#e0e0e0`) with transparent background.
   - The right-column `GOAL ACHIEVED` count badge renders with a subtle tint of the habit's assigned color.

---

### 5.2. Screen 2: Habit Calendar Desktop (`/calendar`) Matrix Architecture
The primary participant interface (`/calendar`) implements the full monthly matrix layout shown in `_lab5_sec31_habitless.pdf` (p. 3):

```
+---------------------------------------------------------------------------------------------------------+
| [HabitLess Logo]  Habit Calendar (Active)   Dashboard (Under Construction)        demo@dailyhabits.xyz  |
+---------------------------------------------------------------------------------------------------------+
|  <  March 2021  >                                                                   [ + New Habit ]     |
+---------------------+---------------------------------------------------------+-------------------------+
| HABITS              | 1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 [18] 19 ... 31 | GOAL ACHIEVED     |
|                     | M  T  W  T  F  S  S  M  T  W  T  F  S  S  M  T  W  [T]  F ...  S |                         |
+---------------------+---------------------------------------------------------+-------------------------+
| [O] Journal  [Edit] | ✓  ✓  ✓  .  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  [✓]  .      | 20  [ 19 ]              |
| [O] Exercise [Edit] | ✓  .  ✓  ✓  ✓  .  ✓  ✓  .  ✓  ✓  .  ✓  ✓  ✓  ✓  .  [✓]  .      | 20  [ 14 ]              |
| [O] Bathe    [Edit] | ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  ✓  [✓]  .      | 25  [ 19 ]              |
+---------------------+---------------------------------------------------------+-------------------------+
| NOTES SECTION                                                                                           |
| [ + New Note ]                                                                                          |
| * 2021-03-18 | No alcohol: "I gotta make sure I don't let my alcohol intake get regular again."         |
| * 2021-03-17 | Exercise:   "Great energy after morning meditation and workout."                         |
+---------------------------------------------------------------------------------------------------------+
```

#### Detailed Component Breakdown:
1. **Header & Navigation Controls**:
   - Month/Year Navigator (`< March 2021 >`): Previous/Next buttons increment/decrement the queried month and trigger `GET /api/tracking/calendar?month=M&year=YYYY`.
   - Brand logo and top links: `Habit Calendar` (active styling) and `Dashboard` (triggers under-construction toast).
   - `+ New Habit` button: Primary Walnut button opening habit creation modal.
2. **Sticky Left Column (`HABITS`)**:
   - Stays pinned during horizontal table scrolling.
   - Each habit row renders:
     - 10px circular color dot displaying the habit's assigned palette color.
     - Habit title with font size 14px, semi-bold Walnut.
     - Inline `[Edit]` button (subtle text button or pencil icon) opening Screen 4.
3. **Monthly Grid Matrix (Days 1–31)**:
   - Header row 1: Day numbers `1` through `31` (dynamically rendered based on `daysInMonth`).
   - Header row 2: Day-of-week initials (`M`, `T`, `W`, `T`, `F`, `S`, `S`).
   - **Illuminated Active Date Column**: The current calendar day column is highlighted with an active Walnut border, glowing background, and accessibility attribute `aria-current="date"`.
   - **Cell Interactions**:
     - Clicking a cell sends `POST /api/tracking/log` for `(habitId, date)`.
     - Optimistically updates UI state and increments/decrements `goalAchievedCount`.
     - Completed state: Habit color background with centered bold white checkmark `✓`.
     - Inactive/Unchecked state: Hollow cell with border; displays hover state indicating it can be checked.
     - Future dates beyond tomorrow are visually disabled with a dashed or muted border and `cursor: not-allowed`.
4. **Sticky Right Column (`GOAL ACHIEVED`)**:
   - Stays pinned during horizontal table scrolling.
   - Shows Target Count (e.g., `20`) alongside Achieved Count badge (e.g., `[ 19 ]`).
   - If `achieved >= target`, the badge displays a success accent border or checkmark glyph.
5. **Notes Section (Below Calendar)**:
   - Header: "Notes" with timestamp indicator and `+ New Note` action button.
   - List of cards displaying:
     - Date badge (e.g. `March 18, 2021`).
     - Linked habit chip (e.g. `No alcohol` in its assigned habit color).
     - Reflection prose (`content`).
     - Timestamp (`hh:mm a`).

---

### 5.3. Screen 4: "Edit Habit" Modal
Triggered by clicking `[Edit]` on any habit row within the calendar desktop.

* **Modal Title**: "Edit Habit"
* **Form Pre-Population**: Loads existing values (`title`, `description`, `colorHex`, `frequency`, `startDate`, `endDate`, `targetCount`).
* **Input Fields & Validation Controls**:
  1. **Habit Name (`*`)**: Single-line text input (42px height). Validates 2–80 characters. Inline error with `aria-live="polite"`.
  2. **Description**: Multiline text area. Max 500 characters. Character counter: `X / 500`.
  3. **Fixed Habit Color (`*`)**: 8 circular color swatches (32px diameter, 4px gap). Selected swatch renders a 3px Walnut ring outline.
  4. **Frequency (`*`)**: Dropdown selector (`Daily`, `Weekdays`, `3x per Week`, `Weekly`, `Monthly`).
  5. **Date Range**:
     - Start Date (HTML5 date input, defaults to original start date).
     - End Date (optional date input; validates `endDate >= startDate`).
  6. **Monthly Target Count (`*`)**: Numeric integer input (min 1, max 31, default 20).
* **Modal Actions**:
  - Primary button: "Save Changes" (Walnut background `#724319`, white text). Shows spinner when submitting.
  - Secondary button: "Cancel" (neutral outline; closes modal without persisting).
  - Destructive action: "Archive Habit" (Light Coral text; triggers soft-delete confirmation).

---

### 5.4. Calendar Notes Feed & `+ New Note` Interaction
* **Trigger**: Clicking `+ New Note` in the Notes section below the calendar.
* **Inline / Modal Note Creator**:
  - Date Picker (defaults to current active date or today).
  - Habit Selector Dropdown (lists all participant's active habits, plus "General Reflection / None").
  - Reflection Input: Multiline text area, min 1 char, max 1000 chars.
  - "Post Note" button (Walnut `#724319`) submitting `POST /api/tracking/notes`.
* **Feed Display**: Cards ordered descending by `noteDate` and `createdAt`.

---

### 5.5. Complete UI State Matrix & Responsive Adaptations

| State | Calendar Matrix Behavior | Notes Section Behavior | Goals Column Behavior |
| :--- | :--- | :--- | :--- |
| **Initial Loading** | Shimmer skeleton table rows for 8 habits and 31 columns. | Skeleton cards with pulsing placeholders. | Skeleton badges in `GOAL ACHIEVED` column. |
| **Empty State (0 Habits)** | "No habits created yet. Click '+ New Habit' to begin tracking." | "No reflection notes yet. Log your first habit reflection." | Displays `- / -`. |
| **Optimistic Cell Toggle** | Cell immediately fills with habit color + `✓`; goals counter increments by 1. | Unaffected. | Instantly reflects `achieved + 1`. |
| **Cell Toggle Error (Rollback)** | Cell reverts to unchecked state; toast: "Could not save log. Reverting." | Unaffected. | Counter decrements back by 1. |
| **Future Date Attempt** | Cursor displays `not-allowed`; tooltip: "Future dates cannot be logged yet." | Date picker restricts future dates. | Unaffected. |
| **Form Error (`422`)** | Modal displays red field-level messages (`aria-live="polite"`). | Character limit red warning > 1000 chars. | Unaffected. |
| **API Failure / Offline** | Sticky error banner: "Unable to load calendar data. [Retry]". | Retry button in notes container. | Shows `- / -`. |

#### Responsive Breakpoint Adaptations:
* **Desktop Viewport (&ge; 992px)**:
  - Full 31-day desktop grid matrix rendered in container (max-width 1200px) centered on Powder Blush canvas (`#f7b1b0`).
  - Sticky `HABITS` column frozen on left; sticky `GOAL ACHIEVED` column frozen on right.
  - Cell click targets minimum 28px &times; 28px.
* **Tablet Viewport (768px – 991px)**:
  - Horizontal scroll container for the 31-day matrix with pinned sticky `HABITS` column.
  - Smooth scrollbar indicator with swipeable gestures.
  - Standard 42px touch heights for all inputs and buttons.
* **Mobile Viewport (< 768px)**:
  - 31-day grid automatically shifts to a responsive 7-day rolling strip with a weekly selector (`< Week of Mar 15 >`).
  - Left habit column renders as stacked habit cards with large &ge;44px touch-friendly toggle targets.
  - Goals tracker renders as a compact pill badge below each habit title.
  - Notes section stacks in a single-column vertical flow with full-width cards.

---

## 6. Software Test Specification

The test suite for Feature 3 is codified in `docs/sprint-01/tests.md` across Unit, API, Component, and End-to-End levels:

### 6.1. Unit Tests (`server/tests/sprint-01/goals.test.ts`)
* **Test ID**: **UT-04**
* **Target Requirements**: **FR-11**, **BR-06**
* **Test Cases**:
  1. `calculateMonthlyGoals(logs, targetCount)`: Returns correct count of completed logs within the target month.
  2. Ignores logs marked `completed: false`.
  3. Ignores logs belonging to other months (e.g. February logs excluded when calculating March).
  4. Returns `achieved: 0` when no logs exist for the habit.
  5. Correctly handles target counts ranging from 1 to 31.

---

### 6.2. API Integration Tests (`server/tests/sprint-01/`)

#### 1. In-Calendar Habit Update (`server/tests/sprint-01/habits.api.test.ts` - `API-08`)
* **Test ID**: **API-08**
* **Target Requirements**: **FR-10**, **BR-01**, **BR-02**, **BR-03**, **BR-04**, **BR-05**, **AC-07**
* **Test Cases**:
  1. `PUT /api/habits/:id` updates title, description, color, frequency, and target count; returns `200 OK` with updated DTO.
  2. Rejects update with non-palette hex color (e.g. `#123456`) with `422 Unprocessable Entity` (`INVALID_HABIT_COLOR`).
  3. Rejects inverted date range (`endDate < startDate`) with `422 Unprocessable Entity` (`INVALID_DATE_RANGE`).
  4. Rejects title < 2 chars or > 80 chars with `422 Unprocessable Entity`.
  5. Rejects `targetCount < 1` or `targetCount > 31` with `422 Unprocessable Entity` (`INVALID_TARGET_COUNT`).
  6. Enforces Participant Data Isolation (**BR-01**): Attempting to update another participant's habit returns `404 Not Found` (`HABIT_NOT_FOUND`).
  7. Rejects unauthenticated calls with `401 Unauthorized` and `PROGRAM_MANAGER` tokens with `403 Forbidden`.

#### 2. Calendar Grid & Goals Endpoint (`server/tests/sprint-01/calendar.api.test.ts` - `API-10`)
* **Test ID**: **API-10**
* **Target Requirements**: **FR-09**, **FR-11**, **AC-06**
* **Test Cases**:
  1. `GET /api/tracking/calendar?month=3&year=2021` returns `200 OK` with `daysInMonth: 31`, `dayInitials` (matching each day of month), and habits array.
  2. Days map contains boolean completion flags corresponding to database `HabitLog` entries.
  3. Correctly calculates `goalAchievedCount` for each habit.
  4. Leap year verification: `GET /api/tracking/calendar?month=2&year=2024` returns `daysInMonth: 29`.
  5. Missing or invalid query parameters (e.g. `month=13` or `year=abc`) return `400 Bad Request`.
  6. Cross-user isolation: Response only contains habits and logs belonging to the authenticated participant.
  7. Verifies `GET /api/tracking/goals` returns HTTP 200 with `activeHabitsCount`, `totalGoalsAchievedThisMonth`, and `habitsSummary[]`, validates calculations against `UT-04`, and enforces participant data isolation (`401` unauthenticated, `403` for `PROGRAM_MANAGER`).

#### 3. Calendar Reflection Notes (`server/tests/sprint-01/notes.api.test.ts` - `API-11`)
* **Test ID**: **API-11**
* **Target Requirements**: **FR-12**, **BR-01**, **AC-08**
* **Test Cases**:
  1. `POST /api/tracking/notes` with valid `noteDate` and `content` saves `DailyNote` and returns `201 Created`.
  2. Optional `habitId` linking: successfully links to an owned habit.
  3. Cross-user protection: Linking a `habitId` belonging to another participant returns `404 Not Found`.
  4. Rejects empty content or content exceeding 1000 chars with `422 Unprocessable Entity`.
  5. `GET /api/tracking/notes` lists notes ordered descending by date; verified isolated to authenticated user.

---

### 6.3. UI Component Tests (`client/tests/sprint-01/`)

#### 1. Calendar Matrix Component (`client/tests/sprint-01/CalendarMatrix.test.tsx` - `UI-04`)
* **Test ID**: **UI-04**
* **Target Requirements**: **FR-09**, **FR-11**, **AC-06**
* **Assertions**:
  - Renders 1–31 header columns with day initials (`M T W T F S S`).
  - Top date header illuminates active date with `aria-current="date"`.
  - Renders sticky `HABITS` column and sticky `GOAL ACHIEVED` column.
  - Completed cells render habit color and checkmark glyph `✓`.
  - Accessible `aria-label` formatted per cell: e.g., `aria-label="Journal, March 18: Completed"`.
  - Clicking cell fires toggle callback with `(habitId, date)`.

#### 2. In-Calendar Edit Modal (`client/tests/sprint-01/EditHabitModal.test.tsx` - `UI-05`)
* **Test ID**: **UI-05**
* **Target Requirements**: **FR-10**, **AC-07**
* **Assertions**:
  - Opens when `[Edit]` button is clicked; form inputs are pre-populated with existing habit values.
  - Renders all 8 circular habit swatches with active outline on the habit's current color.
  - Target count input accepts values 1–31.
  - Submitting valid form calls API update and triggers callback with new data.
  - Cancel button closes modal without calling API.

#### 3. Calendar Notes Component (`client/tests/sprint-01/CalendarNotes.test.tsx` - `UI-06`)
* **Test ID**: **UI-06**
* **Target Requirements**: **FR-12**, **AC-08**
* **Assertions**:
  - Renders existing reflection cards with date, linked habit chip, and content.
  - Clicking `+ New Note` toggles note creation form.
  - Validates character limit (1–1000 chars) with interactive counter.
  - Submitting note appends new card to the feed.

---

### 6.4. End-to-End Browser Test (`e2e/sprint-01/calendar-edit.spec.ts` - `E2E-02`)
* **Test ID**: **E2E-02**
* **Target Acceptance Criteria**: **AC-06**, **AC-07**, **AC-08**
* **User Journey Flow**:
  1. Participant logs in and automatically lands on `/calendar`.
  2. Desktop calendar matrix is verified visible with 1–31 day headers, illuminated current day column, and goals column (`20 / 19`).
  3. Participant clicks a cell in the matrix for day 15; cell turns into the habit's color with `✓`, and `goalAchievedCount` increments.
  4. Participant clicks `[Edit]` on the "Journal" habit row; modal opens.
  5. Participant updates title to "Evening Journal" and changes target count to `22`; clicks "Save Changes".
  6. Calendar row updates immediately with "Evening Journal" and target count `22`.
  7. Participant scrolls to Notes section, clicks `+ New Note`, types "Felt great after daily routine", and clicks submit.
  8. New reflection card is verified present in the notes feed.

---

### 6.5. Responsive, Visual & Accessibility Verifications
* **WCAG 2.2 AA Compliance**:
  - Walnut text `#724319` on Powder Blush background `#f7b1b0` achieves contrast ratio of 6.1:1, exceeding WCAG 2.2 AA requirements.
  - White text on Walnut `#724319` buttons achieves 9.4:1 contrast ratio.
  - Every calendar cell includes descriptive `aria-label` (e.g. `aria-label="Exercise, March 18: Completed"`).
  - Top active day indicator carries `aria-current="date"`.
  - Completion is conveyed through **both color and glyph**: color pill + explicit checkmark `✓`.
* **Viewport Adaptations**:
  - Desktop (&ge; 992px): Verified full 31-day table with frozen left/right headers.
  - Tablet (768–991px): Verified smooth horizontal scrolling container.
  - Mobile (< 768px): Verified 7-day rolling strip with &ge;44px touch targets.

---

## 7. Reconciliations, Ambiguities & Open Questions

The following genuine source ambiguities across the v1.5 Sprint 1 specifications are documented here for implementation alignment:

1. **Past-Day Cell Editability in Calendar Matrix**:
   - *Ambiguity*: `specification.md` Section 2 and `FR-08` state that daily habits are toggled directly within the *illuminated active column* for today's date. However, Section 3.1, `AC-07`, and `E2E-02` state that the calendar desktop allows toggling completion checkmarks across *past and current days* of the month.
   - *Resolution for Feature 3*: In Feature 2, toggling was limited to today's illuminated column. In Feature 3, the full 1–31 grid matrix enables toggling checkmarks for **any past day of the month as well as the illuminated today column** (up to tomorrow). Future dates beyond tomorrow remain strictly disabled (`cursor: not-allowed` and backend `422 CANNOT_LOG_FUTURE_DATE`).
2. **Month and Year Filtering on `GET /api/tracking/notes`**:
   - *Ambiguity*: `api-spec.md` line 444 specifies `GET /api/tracking/notes` returning an unfiltered array of notes, while the calendar UI has month/year navigation (`< March 2021 >`).
   - *Resolution for Feature 3*: `GET /api/tracking/notes` will accept optional query parameters `?month=M&year=YYYY` so notes can be filtered to match the currently selected calendar month, while defaulting to returning all recent notes if omitted.
3. **Consumption of `GET /api/tracking/goals` vs. `GET /api/tracking/calendar`**:
   - *Ambiguity*: `GET /api/tracking/calendar` already embeds `targetCount` and `goalAchievedCount` directly on each habit object, which fully powers the right-hand `GOAL ACHIEVED` column.
   - *Resolution for Feature 3*: `GET /api/tracking/calendar` is the primary endpoint consumed by the calendar view for both the 31-day matrix and the right-column goals badges. `GET /api/tracking/goals` provides an aggregate summary (`totalGoalsAchievedThisMonth`, `activeHabitsCount`) for header statistics, dashboard summaries, and external consumer integration.
4. **`HabitLog` Model vs `HabitLog.notes` Column**:
   - *Ambiguity*: Early design drafts included an optional `notes` text column on `HabitLog`.
   - *Resolution for Feature 3*: In strict alignment with the approved v1.5 schema, timestamped reflections are maintained in the dedicated `DailyNote` model (`daily_notes` table) with optional `habitId`, providing a dedicated feed of timestamped entries below the calendar rather than cluttering individual log toggles.
5. **`dayInitials` Alignment with 1–31 Day Columns**:
   - *Ambiguity*: In `api-spec.md` line 388, the example response for `GET /api/tracking/calendar` lists `["M", "T", "W", "T", "F", "S", "S"]` (7 items), while the UI matrix desktop in `_lab5_sec31_habitless.pdf` (p. 3) displays a column initial for every single day of the month (28–31 columns).
   - *Resolution for Feature 3*: The backend `GET /api/tracking/calendar` returns `dayInitials` as an array of length equal to `daysInMonth` (e.g. 31 elements for March: `["M", "T", "W", "T", "F", "S", "S", "M", ...]`), where index `i` matches day `i + 1`. The frontend also safely derives the day-of-week initial using `new Date(Date.UTC(year, month - 1, dayNumber)).getUTCDay()` as a fallback.
6. **Website Theme Background Canvas Token**:
   - *Reconciliation*: In accordance with the updated Sprint 1 specifications (`ui-spec.md` §1.1 and §6.1), the global application backdrop canvas is **Powder Blush** (`--powder-blush: #f7b1b0`), achieving a 6.1:1 contrast ratio with Walnut typography (`#724319`). **Papaya Whip** (`--papaya-whip: #feeac7`) is utilized for card borders, subtle row hover highlights, and dividers.

