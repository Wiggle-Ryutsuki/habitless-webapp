# Feature 2 Engineering Contract: Custom Habit Creation & Habit Calendar Integration

**Feature ID**: FEATURE-HL-02  
**Target Branch**: `feature/2-habit-checklist`  
**Base Branch**: `staging` (or `feature/1-auth-roles`)  
**Status**: Approved Specification Baseline (Aligned with Unified Habit Calendar Architecture)  
**Version**: 1.2  
**Sprint Alignment**: Sprint 1 (MVP Increment 2 of 4, v1.5 Specifications)  
**Parent Specifications**:  
- [`docs/sprint-01/specification.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/specification.md)  
- [`docs/sprint-01/api-spec.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/api-spec.md)  
- [`docs/sprint-01/ui-spec.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/ui-spec.md)  
- [`docs/sprint-01/tests.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/tests.md)  
- [`docs/sprint-01/_lab5_sec31_habitless.pdf`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/_lab5_sec31_habitless.pdf)  
 
---

## 1. Purpose, Scope, and Explicit Exclusions

### 1.1. Purpose & Deliverables
Feature 2 delivers the primary daily value loop for participants in HabitLess: defining personal habits with customizable recurrence rules and tracking daily completion on the unified **Habit Calendar** (`/calendar`).

Daily habits and the habit calendar desktop are **not separate pages**. The habit calendar displays all the days of the week and month (days 1–31 with day-of-week initials `M T W T F S S`), a date header on top that **lights up which column/day is editable to check habits**, and a side list of daily habits on the left of the calendar appearing for that day. The participant has two primary pages: the **Habit Calendar** (`/calendar`) and the **Dashboard** (`/dashboard`), which is not yet implemented in Sprint 1 MVP and will only popup a notification stating *"Dashboard is still under construction"*.

It delivers:
1. **Participant Custom Habit Creation**:
   - Creation of custom habits via the `+ New Habit` modal (`Screen 4`).
   - Fields: Title (required, 2–80 chars), Description (optional, max 500 chars), Fixed Habit Palette Color (required 8-color swatch selection), Recurrence Frequency (`DAILY`, `WEEKDAYS`, `THREE_TIMES_WEEKLY`, `WEEKLY`, `MONTHLY`, `CUSTOM_DAYS`), Date Schedule (Start Date defaults to today, optional End Date where `endDate >= startDate`), and Monthly Target Count (default 20, min 1, max 31).
2. **Fixed Habit Color Enforcement**:
   - Strict validation against the 8 predefined habit palette tokens (`#448aff`, `#1565c0`, `#009688`, `#8bc34a`, `#ffc107`, `#ff9800`, `#f44336`, `#ad1457`) or their 8-digit `#RRGGBBff` representations. Arbitrary hex colors are rejected with HTTP 422.
3. **Habit Management REST Endpoints**:
   - `GET /api/habits`: List all active/archived habits belonging to the authenticated participant.
   - `POST /api/habits`: Create a new custom habit.
   - `GET /api/habits/:id`: Fetch single habit details with strict ownership verification.
   - `PUT /api/habits/:id`: Update habit details (backend API implemented in Feature 2; in-calendar UI editing triggers in Feature 3).
   - `DELETE /api/habits/:id`: Soft-archive a habit (`isActive: false`).
4. **Today's Daily Habit Engine & Habit Calendar Integration (`/calendar`)**:
   - Dynamic schedule evaluation engine determining whether a habit is active on the query date (evaluating frequency rule, active day-of-week mask, start date, and end date bounds).
   - `GET /api/tracking/today`: Returns today's scheduled habits, total scheduled count, completed count, and individual log IDs.
   - Powers the side list of daily habits on the Habit Calendar (`/calendar`) and the active state of the illuminated editable day column.
   - **Dashboard Placeholder (`/dashboard`)**: Visiting `/dashboard` or clicking the "Dashboard" nav link triggers a popup notification toast stating: *"Dashboard is still under construction"*.
5. **Idempotent Daily Logging**:
   - `POST /api/tracking/log`: Check/uncheck toggle for `(habitId, date)`.
   - Checking an item creates or updates the `HabitLog` completion record (`completed: true`).
   - Unchecking an item removes the completion record (or marks `completed: false`).
   - Relational uniqueness constraint `@@unique([habitId, logDate])` guarantees idempotency (double-clicking or duplicate submissions will not produce multiple logs).
   - Boundary rule: Logging dates beyond tomorrow is rejected (`422 Unprocessable Entity`).

---

### 1.2. Explicit Exclusions (Strict Scope Boundary)

To maintain a strict MVP boundary and keep increments decoupled:
* **Excluded Feature 1 Dependencies**:
  - Authentication, password hashing, session cookies, and health probes are assumed functional and merged from Feature 1 (`feature/1-auth-roles`).
* **Excluded Feature 3 Capabilities (Full 31-Day Grid History, In-Calendar Edit & Goals)**:
  - Historical completion logging across all 31 individual day columns of the month (Feature 2 focuses on daily completion logging for today in the illuminated active date column).
  - In-calendar habit edit modal (`PUT /api/habits/:id` invoked from grid row buttons; Feature 2 provides the backend API and focuses on habit creation).
  - Monthly Goals Tracker summary widget (`targetCount` vs `achievedCount` calculations in the right column and `/api/tracking/goals`).
  - Timestamped reflection notes section below the grid (`GET /api/tracking/notes`, `POST /api/tracking/notes`, and `+ New Note` button).
* **Excluded Feature 4 Capabilities (Program Manager Challenges)**:
  - Program Manager Challenge Program builder (`/manager`, `Screen 5`).
  - Standardized activity definitions and web deployment/invitation link generation.
  - Participant challenge discovery marketplace and enrollment flows.
* **Excluded Non-MVP & Deferred Capabilities (Post-Sprint 1 per `_lab5_sec31_habitless.pdf`)**:
  - Arbitrary hex color pickers (only the fixed palette swatches are selectable).
  - Streak counters, current streaks, and "highest streak" gamification badges.
  - Habit completion percentages, analytics charts, and trend statistics.
  - Daily mood tracker calendar.
  - Email or SMS reminder notifications.
  - One-click CSV log export.
  - Bug report form.
  - Manager active roster participant removal/deactivation.
  - Manager challenge and category popularity analytics.

---

## 2. Requirements Traceability Matrix

| Requirement / Rule / AC | Description | Implementation Target in Feature 2 |
| :--- | :--- | :--- |
| **FR-04** | Habit Creation | `POST /api/habits`, `+ New Habit` modal form (`Screen 4`) on `/calendar`. |
| **FR-05** | Fixed Habit Colors | 8-swatch circular color picker component (`UI-02`), backend validator `palette-validator.ts` (`UT-01`). |
| **FR-06** | Habit Frequency Rules | `FrequencyType` enum, schedule evaluation engine `frequency.ts` (`UT-03`). |
| **FR-07** | Unified Habit Calendar & Daily Habits | `GET /api/tracking/today`, `/calendar` side daily habits list & illuminated active day column (`Screen 2`, `UI-03`). Dashboard (`/dashboard`) triggers "Dashboard is still under construction" notification (`UI-08`). |
| **FR-08** | Habit Logging | `POST /api/tracking/log` idempotent check/uncheck (`API-09`). |
| **BR-01** | Participant Data Isolation | `requireAuth` + `requireRole('PARTICIPANT')` middleware; database queries filtered by `userId = req.user.id`. Cross-user access or non-existent habit returns HTTP 404 Not Found (`HABIT_NOT_FOUND`) to prevent resource enumeration; `PROGRAM_MANAGER` tokens return HTTP 403 Forbidden. |
| **BR-02** | Fixed Habit Palette Restriction | Habit colors must strictly match one of the 8 predefined habit color hex constants (`#448aff`, `#1565c0`, `#009688`, `#8bc34a`, `#ffc107`, `#ff9800`, `#f44336`, `#ad1457`) or `#RRGGBBff`. Non-palette colors return HTTP 422. |
| **BR-03** | Habit Name Constraints | Required, single-line string, auto-trimmed, minimum 2 characters, maximum 80 characters. Empty or whitespace-only names rejected with HTTP 422. |
| **BR-04** | Description Constraints | Optional multiline text, maximum 500 characters. Values > 500 characters rejected with HTTP 422. |
| **BR-05** | Date Range Invariant | `endDate` must be greater than or equal to `startDate` (`schedule-validator.ts`, `UT-02`). Inverted date ranges rejected with HTTP 422. |
| **BR-06** | Idempotent Daily Logging | Relational uniqueness `@@unique([habitId, logDate])`. Checking an item creates/updates record; unchecking deletes record. Repeated toggles produce consistent state. Future dates beyond tomorrow rejected with HTTP 422. |
| **AC-01** | Role-Based Post-Auth Routing | Participant registration or login automatically routes to `/calendar` (Habit Calendar). Program manager routes to `/manager`. |
| **AC-03** | Habit Creation with Fixed Color | Submitting valid habit with title, frequency, target count, and palette color returns HTTP 201 Created and renders habit in side daily habits list and calendar row. |
| **AC-04** | Invalid Habit Color Rejection | Submitting arbitrary hex color outside the 8 palette colors returns HTTP 422 `INVALID_HABIT_COLOR`. |
| **AC-05** | Habit Calendar Side Habits & Active Column Toggle | Scheduled habits render in the side daily habits list; clicking the completion cell in the illuminated active day column updates completion state optimistically, persists via `POST /api/tracking/log`, displays habit color with checkmark `✓`, and updates completion tally. |
| **AC-06** | Dashboard Under Construction Notification | Navigating to `/dashboard` or clicking the "Dashboard" navigation link triggers a popup notification stating "Dashboard is still under construction". |

---

## 3. Data Design & Idempotent Seed Requirements

### 3.1. Prisma Schema Evolution (`server/prisma/schema.prisma`)
This increment expands the Prisma schema to add the `FrequencyType` enum, the `Habit` model, and the `HabitLog` model, establishing the relation to `User`:

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
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  fullName     String
  role         Role     @default(PARTICIPANT)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  habits       Habit[]

  @@map("users")
}

model Habit {
  id          Int           @id @default(autoincrement())
  userId      Int
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?
  colorHex    String        @default("#ff9800")
  frequency   FrequencyType @default(DAILY)
  daysOfWeek  Int[]         @default([1, 2, 3, 4, 5, 6, 7]) // ISO-8601: 1=Mon, 7=Sun
  startDate   DateTime      @default(now())
  endDate     DateTime?
  targetCount Int           @default(20)
  isActive    Boolean       @default(true)
  programId   Int?          // Reserved for Feature 4 Challenge Program integration
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  logs        HabitLog[]

  @@index([userId, isActive])
  @@map("habits")
}

model HabitLog {
  id        Int      @id @default(autoincrement())
  habitId   Int
  habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  logDate   DateTime @db.Date // Normalized to calendar date YYYY-MM-DD (midnight UTC)
  completed Boolean  @default(true)
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([habitId, logDate])
  @@index([logDate])
  @@map("habit_logs")
}
```

---

### 3.2. Idempotent Seed Additions (`server/prisma/seed.ts`)
The seed script will be enhanced to seed realistic MVP tracking data for Demo Participant 1 (`participant1@habitless.internal` / `Alex Rivera`) without duplicating records on multiple runs:

1. **Active Sample Habits for Participant 1**:
   - **Habit 1**: Title: `"Journal"`, Description: `"Daily reflection before bed"`, Color: `#ff9800` (Amber Glow), Frequency: `DAILY`, `daysOfWeek: [1, 2, 3, 4, 5, 6, 7]`, `targetCount: 20`.
   - **Habit 2**: Title: `"Exercise"`, Description: `"Daily workout or 30-min run"`, Color: `#448aff` (Blue Energy), Frequency: `DAILY`, `daysOfWeek: [1, 2, 3, 4, 5, 6, 7]`, `targetCount: 20`.
   - **Habit 3**: Title: `"Read 20 mins"`, Description: `"Non-fiction or personal development"`, Color: `#009688` (Verdigris), Frequency: `WEEKDAYS`, `daysOfWeek: [1, 2, 3, 4, 5]`, `targetCount: 15`.
   - **Habit 4**: Title: `"Meditation"`, Description: `"Morning mindfulness breathing"`, Color: `#8bc34a` (Yellow Green), Frequency: `DAILY`, `daysOfWeek: [1, 2, 3, 4, 5, 6, 7]`, `targetCount: 25`.
2. **Sample Daily Completion Logs**:
   - Seed completion log for Habit 1 (`Journal`) for the current date (`logDate: today`, `completed: true`).
   - Leave Habit 2 (`Exercise`) unchecked for today so the checklist demonstrates `1 of 3 habits completed today`.
   - Seed representative logs across the current month to support test consistency.
3. **Idempotency Guarantee**:
   - Habits are matched by unique composite or lookup `(userId, title)`.
   - Logs are upserted using the unique index `(habitId, logDate)`.

---

## 4. API Specification & RBAC Endpoints

All endpoints in Feature 2 require authentication and role `PARTICIPANT`. Requests without a valid JWT receive HTTP `401 Unauthorized`; requests from users with role `PROGRAM_MANAGER` receive HTTP `403 Forbidden`.

### 4.1. Standard Error Envelope
All error responses adhere to the standard JSON structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error description",
    "fieldErrors": {
      "fieldName": "Specific validation failure message"
    },
    "correlationId": "uuid-string"
  }
}
```

---

### 4.2. Habit Management Endpoints

#### 4.2.1. `GET /api/habits`
* **Purpose**: List habits belonging to the authenticated participant.
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**:
  - `status` (optional string): `"active"` (default, `isActive: true`) or `"archived"` (`isActive: false`).
* **Headers**: Cookie `token=<jwt>` or `Authorization: Bearer <jwt>`.
* **Response `200 OK`**:
```json
[
  {
    "id": 101,
    "userId": 10,
    "title": "Journal",
    "description": "Daily reflection before bed",
    "colorHex": "#ff9800",
    "frequency": "DAILY",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": null,
    "targetCount": 20,
    "isActive": true,
    "programId": null,
    "createdAt": "2026-11-01T08:00:00.000Z",
    "updatedAt": "2026-11-01T08:00:00.000Z"
  }
]
```

---

#### 4.2.2. `POST /api/habits`
* **Purpose**: Create a new custom habit.
* **Access**: Authenticated (`PARTICIPANT`).
* **Request DTO**:
```json
{
  "title": "Journal",
  "description": "Daily reflection before bed",
  "colorHex": "#ff9800",
  "frequency": "DAILY",
  "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
  "startDate": "2026-11-01T00:00:00.000Z",
  "endDate": null,
  "targetCount": 20
}
```
* **Validation Rules**:
  - `title`: Required string, 2–80 characters after whitespace trimming.
  - `description`: Optional string, maximum 500 characters.
  - `colorHex`: Required string. Must match one of the 8 fixed habit palette hexes (case-insensitive, 6-char `#RRGGBB` or 8-char `#RRGGBBff`):
    - `#448aff` (Blue Energy)
    - `#1565c0` (Ocean Deep)
    - `#009688` (Verdigris)
    - `#8bc34a` (Yellow Green)
    - `#ffc107` (Amber Gold)
    - `#ff9800` (Amber Glow)
    - `#f44336` (Cinnabar)
    - `#ad1457` (Cherry Rose)
  - `frequency`: Required enum: `DAILY`, `WEEKDAYS`, `THREE_TIMES_WEEKLY`, `WEEKLY`, `MONTHLY`, `CUSTOM_DAYS`.
  - `daysOfWeek`: Integer array (1 = Monday, 7 = Sunday).
    - Defaults automatically based on frequency if omitted:
      - `DAILY`: `[1, 2, 3, 4, 5, 6, 7]`
      - `WEEKDAYS`: `[1, 2, 3, 4, 5]`
      - `THREE_TIMES_WEEKLY`: `[1, 3, 5]` (Mon, Wed, Fri default)
      - `WEEKLY`: `[1]` (Mon default)
      - `MONTHLY`: Defaults to `[]`. Recurrence is evaluated on the day-of-month matching `startDate.getUTCDate()` (or the last day of shorter months).
    - When `frequency === 'CUSTOM_DAYS'`, `daysOfWeek` must be explicitly provided as a non-empty array with values strictly between 1 and 7 (`1 <= d <= 7`). Empty or out-of-range arrays return HTTP `422 Unprocessable Entity` (`code: "INVALID_DAYS_OF_WEEK"`).
  - `startDate`: Required ISO-8601 date string. Defaults to current date if omitted.
  - `endDate`: Optional ISO-8601 date string. If supplied, must be &ge; `startDate` (invariant **BR-05**).
  - `targetCount`: Optional integer, default `20`, minimum `1`, maximum `31`. Target counts < 1 or > 31 return HTTP `422 Unprocessable Entity` (`code: "INVALID_TARGET_COUNT"`).
* **Response `201 Created`**:
```json
{
  "id": 101,
  "userId": 10,
  "title": "Journal",
  "description": "Daily reflection before bed",
  "colorHex": "#ff9800",
  "frequency": "DAILY",
  "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
  "startDate": "2026-11-01T00:00:00.000Z",
  "endDate": null,
  "targetCount": 20,
  "isActive": true,
  "programId": null,
  "createdAt": "2026-11-13T08:00:00.000Z",
  "updatedAt": "2026-11-13T08:00:00.000Z"
}
```
* **Error `422 Unprocessable Entity`** (Invalid Color):
```json
{
  "error": {
    "code": "INVALID_HABIT_COLOR",
    "message": "Color must be one of the 8 fixed habit palette colors: #448aff (Blue Energy), #1565c0 (Ocean Deep), #009688 (Verdigris), #8bc34a (Yellow Green), #ffc107 (Amber Gold), #ff9800 (Amber Glow), #f44336 (Cinnabar), #ad1457 (Cherry Rose)."
  }
}
```
* **Error `422 Unprocessable Entity`** (Invalid Date Invariant):
```json
{
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "End date must be greater than or equal to start date."
  }
}
```

---

#### 4.2.3. `GET /api/habits/:id`
* **Purpose**: Retrieve details of an owned habit.
* **Access**: Authenticated (`PARTICIPANT`).
* **Ownership Rule**: If the habit does not exist or belongs to another user, returns HTTP `404 Not Found` (`code: "HABIT_NOT_FOUND"`, message: `"Habit not found."`) to prevent cross-user resource enumeration.
* **Response `200 OK`**: Single Habit DTO matching `POST /api/habits` response.

---

#### 4.2.4. `PUT /api/habits/:id`
* **Purpose**: Update habit details (name, description, color, frequency, dates, targetCount).
* **Access**: Authenticated (`PARTICIPANT` owner).
* **Validation**: Identical to `POST /api/habits`.
* **Ownership Rule**: Returns HTTP `404 Not Found` (`code: "HABIT_NOT_FOUND"`) if the habit does not exist or `userId !== req.user.id`.
* **Response `200 OK`**: Updated Habit DTO.

---

#### 4.2.5. `DELETE /api/habits/:id`
* **Purpose**: Soft-archive habit by setting `isActive: false`.
* **Access**: Authenticated (`PARTICIPANT` owner).
* **Ownership Rule**: Returns HTTP `404 Not Found` (`code: "HABIT_NOT_FOUND"`) if the habit does not exist or `userId !== req.user.id`.
* **Response `204 No Content`** (empty body).

---

### 4.3. Daily Tracking & Habit Calendar Endpoints

> **Architectural Mapping & Unified Screen Feeding**:  
> In accordance with the v1.5 unified architecture, daily habits and the desktop calendar are **not separate pages**.  
> - `GET /api/tracking/today` powers the left side panel of daily habits scheduled for the active date, as well as the active state of the illuminated editable day column on the Habit Calendar (`/calendar`).  
> - `POST /api/tracking/log` processes check/uncheck toggles when the user clicks cells in the active illuminated date column.  
> - Visiting `/dashboard` or clicking the "Dashboard" navigation link triggers a client-side notification popup (*"Dashboard is still under construction"*); no dedicated `/api/dashboard` endpoint is required for Sprint 1.

#### 4.3.1. `GET /api/tracking/today`
* **Purpose**: Retrieve checklist of today's assigned habits and activities for the current calendar date (`HabitLess App Design`, pp. 1, 4). Powers the side daily habits list and the illuminated active day column on the Habit Calendar (`/calendar`).
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**:
  - `date` (optional string, `YYYY-MM-DD`): To guarantee timezone fidelity, the frontend client explicitly passes its local date (e.g. `?date=2026-11-13` derived via `new Date().toLocaleDateString('en-CA')`). If omitted, the server defaults to current UTC calendar date. The backend normalizes the query date to UTC midnight (`YYYY-MM-DDT00:00:00.000Z`).
* **Business Logic**:
  1. Retrieve all active habits (`isActive: true`, `userId = req.user.id`).
  2. If the active habit set is empty, return `{ date, totalScheduled: 0, completedCount: 0, items: [] }` immediately without executing redundant log queries.
  3. For each active habit, evaluate whether it is scheduled for query date $D$:
     - Check start boundary: `startDate <= D`.
     - Check end boundary: `endDate === null || endDate >= D`.
     - Check frequency recurrence:
       - `DAILY`: Always scheduled.
       - `WEEKDAYS`: Scheduled if ISO day-of-week $d \in [1, 2, 3, 4, 5]$ (Mon–Fri).
       - `THREE_TIMES_WEEKLY`: Scheduled if $d \in \text{daysOfWeek}$ (default Mon, Wed, Fri).
       - `WEEKLY`: Scheduled if $d \in \text{daysOfWeek}$ (default Mon).
       - `MONTHLY`: Scheduled if $D$'s day-of-month equals `startDate.getUTCDate()` (or last day of month if $D$ has fewer days).
       - `CUSTOM_DAYS`: Scheduled if $d \in \text{daysOfWeek}$.
  4. Query `HabitLog` records for `habitId IN (scheduledHabitIds)` and `logDate = D`.
  5. Aggregate completion tally (`totalScheduled`, `completedCount`).
* **Response `200 OK`**:
```json
{
  "date": "2026-11-13",
  "totalScheduled": 3,
  "completedCount": 1,
  "items": [
    {
      "habitId": 101,
      "title": "Journal",
      "description": "Daily reflection before bed",
      "colorHex": "#ff9800",
      "frequency": "DAILY",
      "isCompleted": true,
      "logId": 501
    },
    {
      "habitId": 102,
      "title": "Exercise",
      "description": "Daily workout or 30-min run",
      "colorHex": "#448aff",
      "frequency": "DAILY",
      "isCompleted": false,
      "logId": null
    },
    {
      "habitId": 103,
      "title": "Read 20 mins",
      "description": "Non-fiction reading",
      "colorHex": "#009688",
      "frequency": "WEEKDAYS",
      "isCompleted": false,
      "logId": null
    }
  ]
}
```

---

#### 4.3.2. `POST /api/tracking/log`
* **Purpose**: Idempotently toggle habit completion for a specific calendar date (typically triggered by clicking a habit cell in the illuminated active day column on the Habit Calendar `/calendar`) (`HabitLess App Design`, pp. 1, 3, 4).
* **Access**: Authenticated (`PARTICIPANT`).
* **Request DTO**:
```json
{
  "habitId": 102,
  "date": "2026-11-13",
  "completed": true,
  "notes": null
}
```
* **Validation Rules**:
  - `habitId`: Required integer. Habit must exist and belong to `req.user.id` (returns HTTP `404 Not Found` with `code: "HABIT_NOT_FOUND"` if belonging to another user or non-existent).
  - Habit status: If the referenced habit has `isActive: false`, returns HTTP `422 Unprocessable Entity` (`code: "HABIT_ARCHIVED"`, message: `"Cannot log completions for an archived habit."`).
  - `date`: Required string in ISO format `YYYY-MM-DD`. Malformed date formats return HTTP `422 Unprocessable Entity` (`code: "INVALID_DATE_FORMAT"`). Cannot be a future date beyond tomorrow relative to UTC ($D > \text{today} + 1\text{ day}$ returns `422 INVALID_LOG_DATE`).
  - `completed`: Required boolean.
  - `notes`: Optional string, max 500 characters.
* **Execution Semantics**:
  - If `completed === true`: Upserts `HabitLog` on `(habitId, logDate)` setting `completed: true`.
  - If `completed === false`: Deletes the existing `HabitLog` record (or marks `completed: false`).
* **Response `200 OK`**:
```json
{
  "habitId": 102,
  "date": "2026-11-13",
  "completed": true,
  "updatedAt": "2026-11-13T08:15:00.000Z"
}
```
* **Error `422 Unprocessable Entity`** (Future date rejected):
```json
{
  "error": {
    "code": "INVALID_LOG_DATE",
    "message": "Cannot log habit completion for dates beyond tomorrow."
  }
}
```
* **Error `422 Unprocessable Entity`** (Archived habit rejected):
```json
{
  "error": {
    "code": "HABIT_ARCHIVED",
    "message": "Cannot log completions for an archived habit."
  }
}
```

---

## 5. UI Specification & Visual Design Tokens

### 5.1. Design Tokens & Theme Application
Feature 2 interfaces use the **HabitLess Warm Natural Palette** for UI chrome and layout surfaces, coupled with the **Fixed Habit Palette** for habit visual identity:

#### 5.1.1. Website Theme Tokens (UI Chrome & Backdrop)
* `--walnut`: `#724319` (Headers, brand title, primary buttons, card title text)
* `--light-coral`: `#d88180` (Secondary buttons, modal cancel buttons, accent hover)
* `--powder-blush`: `#f7b1b0` (Main canvas and page backdrop)
* `--papaya-whip`: `#feeac7` (Card borders, dividers, subtle accents, input borders)
* `--golden-sand`: `#cad182` (Active completion state highlight, badge accents)
* `--color-surface`: `#ffffff` (Card and modal containers)
* `--color-text-main`: `#2d1c0b` (High-contrast typography)
* `--color-text-muted`: `#6b5e51` (Captions, helper labels, timestamps)
* `--color-border-subtle`: `#feeac7` (Borders and horizontal dividers)
* `--color-error`: `#b3261e` (Inline validation errors)
* `--color-error-bg`: `#fdf2f2` (Error banners)

#### 5.1.2. Fixed Habit Palette Tokens (User-Selectable Swatches)
Used strictly for habit indicator strips, circular swatches, checklist badges, and completion checks:
* `--blue-energy`: `#448aff` (Vibrant Energy Blue)
* `--ocean-deep`: `#1565c0` (Deep Ocean Navy)
* `--verdigris`: `#009688` (Teal Verdigris)
* `--yellow-green`: `#8bc34a` (Vibrant Leaf Green)
* `--amber-gold`: `#ffc107` (Warm Gold Amber)
* `--amber-glow`: `#ff9800` (Warm Sun Orange)
* `--cinnabar`: `#f44336` (Bright Coral Red)
* `--cherry-rose`: `#ad1457` (Deep Raspberry Rose)

---

### 5.2. Screen 2: Habit Calendar Desktop (`/calendar`) [Primary Participant Screen]
* **Unified Layout Architecture**:
  - Daily habits and the habit calendar desktop are **not separate pages**. They are unified into a single desktop interface on `/calendar`.
  - Top Navigation Shell (`Header.tsx`): Brand logo (`HabitLess`), navigation links (`Habit Calendar` active, `Dashboard` which triggers "Dashboard is still under construction" popup), active participant badge, user email, `[ Log Out ]` button.
  - Month/Year Navigator: `< March 2021 >` with month selection and user indicator.
  - Top Active Date Header / Indicator: Prominently **lights up / illuminates which column/day is editable** for checking off habits today (e.g. active date header highlighted with illuminated background, active border, and date callout).
  - Left Side Panel (`HABITS` Column): Vertical list of daily habits scheduled for today. Each row displays:
    - Left edge color strip (6px width) matching the habit's assigned color from the 8 habit tokens.
    - Habit title and frequency badge (e.g. "Daily", "Weekdays").
    - Inline `[Edit]` action button.
  - Center Grid (1–31 Day Columns):
    - Daily columns labeled with day-of-week initials (`M T W T F S S`) and day numbers (1 to 31).
    - **Illuminated Active Column**: The column corresponding to today's active date is distinctly illuminated/highlighted.
    - **Active Column Checkboxes**: Cells in the illuminated column are interactive checkmark pills. When clicked, toggles daily completion (`POST /api/tracking/log`), filling the cell with the habit's assigned color and a white checkmark `✓`.
  - Right Column (`GOAL ACHIEVED`) & Bottom (`Notes`): Layout anchors reserved for Feature 3 integration.

---

### 5.3. Screen 3: Participant Dashboard (`/dashboard`) [Under Construction Placeholder]
* **Route**: `/dashboard`
* **Trigger**: Clicking "Dashboard" in the header navigation or navigating directly to `/dashboard`.
* **Behavior & Presentation**:
  - Instantly triggers an accessible notification / toast popup: *"Dashboard is still under construction"*.
  - Renders a friendly placeholder card on the `--powder-blush` canvas:
    - Card container: Surface `var(--color-surface)` (`#ffffff`), border `1px solid var(--papaya-whip)`, border-radius `12px`, padding `2.5rem`, text-align center.
    - Title: `"Dashboard Under Construction"` in `--walnut` (`1.5rem`, bold).
    - Description: `"The Participant Dashboard is currently under construction. Please use the Habit Calendar to track your daily habits."` in `--color-text-muted`.
    - Primary Action: `"Go to Habit Calendar"` button (Solid `--walnut`, height `42px`, white text, border-radius `8px`) routing to `/calendar`.

---

### 5.4. Screen 4: "+ New Habit" Modal Form
* **Trigger**: Clicking `+ New Habit` button on the Habit Calendar (`/calendar`) header or side habit panel.
* **Modal Backdrop**: Fixed overlay covering viewport (`background: rgba(45, 28, 11, 0.45)`, `z-index: 1000`, backdrop-filter blur).
* **Modal Dialog**:
  - Centered card, `max-width: 520px`, width `95%`, surface `var(--color-surface)` (`#ffffff`), border `1px solid var(--papaya-whip)`, border-radius `12px`, padding `2rem`, box-shadow `0 12px 32px rgba(114, 67, 25, 0.15)`.
  - Accessible dialog semantics: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="new-habit-title"`. Focus trapped within dialog while open; closes on `Escape` key, Cancel button, or backdrop click.
  - **Focus Restoration (WCAG 2.4.3)**: Upon modal closure or successful submission, keyboard focus is programmatically returned to the `+ New Habit` trigger button.
  - **Checklist Synchronization**: Following successful habit creation, if the habit's frequency schedule includes today, the side daily habits list and illuminated active column on the Habit Calendar automatically refetch and update dynamically.
* **Form Fields**:
  1. **Habit Title (`*`)**:
     - Text input, height `42px`, border `1px solid var(--papaya-whip)`, border-radius `6px`, padding `0 0.75rem`.
     - Required marker `*` in red.
     - Auto-focused on modal open.
     - Validation: Required, 2–80 chars.
  2. **Description**:
     - Multiline textarea, 3 rows, max 500 characters, character count indicator (`"X / 500"`).
  3. **Fixed Habit Color Swatches (`*`)**:
     - Section label: `"Habit Color *"`
     - Row of 8 circular buttons (diameter `32px`, minimum touch target `44px`).
     - Colors: Blue Energy, Ocean Deep, Verdigris, Yellow Green, Amber Gold, Amber Glow, Cinnabar, Cherry Rose.
     - Active / Selected State: 3px outer outline or checkmark glyph inside the circle.
     - Accessibility: Radio group semantics `role="radiogroup"`, each swatch `role="radio"`, `aria-checked="true|false"`, `aria-label="Color: {name}"`.
  4. **Frequency Selector (`*`)**:
     - Select dropdown or segmented radio group:
       - `Daily` (Every day)
       - `Weekdays` (Monday through Friday)
       - `3x per Week` (Mon, Wed, Fri)
       - `Weekly` (Once per week)
       - `Monthly` (Once per month)
  5. **Date Schedule (Start & End Dates)**:
     - Start Date: `type="date"`, defaults to today's date.
     - End Date: `type="date"`, optional. Enforces `endDate >= startDate`.
  6. **Monthly Target Count**:
     - Number input, default `20`, min `1`, max `31`.
* **Actions**:
  - Primary Submit: `"Save Habit"` button (Solid `--walnut`, white text, height `42px`, disabled and displays `"Saving..."` when submitting).
  - Secondary: `"Cancel"` button (Transparent background, `--walnut` text, border `1px solid var(--walnut)`).
* **Validation & Error Presentation**:
  - Field errors rendered directly beneath input in `--color-error` with `aria-live="polite"`.

---

### 5.5. Complete UI State Matrix

| UI State | Trigger / Condition | Visual Presentation |
| :--- | :--- | :--- |
| **Loading** | Initial fetch of `GET /api/tracking/today` | Subtle pulsing skeleton rows in side habits panel and calendar grid. |
| **Initial Fetch Error** | Network failure or 500 error on `GET /api/tracking/today` | Error alert card with retry control: *"Unable to load habits. [ Retry ]"* with border `1px solid var(--color-error)`. |
| **Empty Habits** | `totalScheduled === 0` | Empty state card in side panel: *"No habits scheduled for today. Click '+ New Habit' to begin tracking!"* with prominent `+ New Habit` button. |
| **Populated Habits** | `totalScheduled > 0` | Side habits list renders color strips, titles, and edit triggers; active day column displays illuminated check cells. |
| **Active Column Highlight** | Today's active date | Header cell lights up with glowing focus outline; column cells rendered interactive with hover effects. |
| **Optimistic Toggle** | User clicks cell in illuminated column | Cell immediately turns into habit color with checkmark `✓` (or unchecks); completion tally updates; background request dispatched to `POST /api/tracking/log`. |
| **Toggle Failure Reversion** | Network error on `POST /api/tracking/log` | UI rolls back cell to previous state and displays a temporary notification banner: *"Failed to save habit status. Please retry."* |
| **Modal Submitting** | Submitting `+ New Habit` form | Submit button disabled, shows `"Saving..."`; swatches and inputs set to read-only. |
| **Validation Failure** | Form submitted with title < 2 chars or end date < start date | Inputs highlighted with `--color-error` border; error messages announced via `aria-live="polite"`. |
| **Dashboard Under Construction** | User clicks "Dashboard" nav link or visits `/dashboard` | Popup toast notification announces *"Dashboard is still under construction"* (`aria-live="polite"`) and renders under-construction card with link to `/calendar`. |
| **Unauthorized Session** | Token expired during interaction | Redirects cleanly to `/login?redirect=/calendar`. |

---

## 6. Software Test Specification

Tests are specified across unit, API integration, UI component, and end-to-end tiers matching `docs/sprint-01/tests.md`:

### 6.1. Unit Tests (`server/tests/sprint-01/`)

#### 6.1.1. `palette-validator.test.ts` (Mapped to **UT-01**)
* **Test Cases**:
  - Accepts all 8 approved 6-character hex colors: `#448aff`, `#1565c0`, `#009688`, `#8bc34a`, `#ffc107`, `#ff9800`, `#f44336`, `#ad1457`.
  - Accepts 8-character hex equivalents (`#448affff`, etc.).
  - Case insensitivity: Accepts uppercase `#448AFF` and lowercase `#448aff`.
  - Rejects arbitrary hex colors outside the palette (e.g. `#9C27B0`, `#000000`, `#FFFFFF`).
  - Rejects malformed strings (e.g. `"blue"`, `"#123"`, `""`).

#### 6.1.2. `schedule-validator.test.ts` (Mapped to **UT-02**)
* **Test Cases**:
  - Accepts `endDate === null` (ongoing habits).
  - Accepts `endDate === startDate` (single-day habits).
  - Accepts `endDate > startDate`.
  - Rejects `endDate < startDate` with validation error.
  - Rejects invalid date format strings.

#### 6.1.3. `frequency.test.ts` (Mapped to **UT-03**)
* **Test Cases**:
  - `DAILY`: Returns `true` for every day of the week.
  - `WEEKDAYS`: Returns `true` for Monday through Friday (days 1–5); returns `false` for Saturday and Sunday (days 6–7).
  - `THREE_TIMES_WEEKLY`: Returns `true` on configured days (Mon, Wed, Fri); `false` on others.
  - `WEEKLY`: Returns `true` on designated recurrence day.
  - `MONTHLY`: Returns `true` when query date's day-of-month equals `startDate.getUTCDate()` (or the last day of the month if the query month is shorter); returns `false` on all other days.
  - `CUSTOM_DAYS`: Returns `true` when query date's ISO day-of-week is in `daysOfWeek`; returns `false` otherwise.
  - Out of bounds: Returns `false` for dates before `startDate` or after `endDate`.

---

### 6.2. API Integration Tests (`server/tests/sprint-01/`)

#### 6.2.1. `habits.api.test.ts` (Mapped to **API-05**, **API-06**, **API-07**, **API-08**)
* **API-05 (Valid Habit Creation)**:
  - `POST /api/habits` with valid title, `#ff9800`, `DAILY`, and `targetCount: 20`.
  - Asserts HTTP `201 Created`, response matches Habit DTO, record exists in database with `userId`.
* **API-06 (Invalid Habit Color Rejection)**:
  - `POST /api/habits` with arbitrary color `#9C27B0`.
  - Asserts HTTP `422 Unprocessable Entity` with error code `INVALID_HABIT_COLOR`.
* **Negative Field Validation Tests**:
  - Rejects `title` < 2 characters or > 80 characters with HTTP `422 Unprocessable Entity`.
  - Rejects whitespace-only `title` (`"   "`) with HTTP `422 Unprocessable Entity`.
  - Rejects `description` > 500 characters with HTTP `422 Unprocessable Entity`.
  - Rejects `endDate < startDate` with HTTP `422 Unprocessable Entity` (`INVALID_DATE_RANGE`).
  - Rejects `targetCount` < 1 or > 31 with HTTP `422 Unprocessable Entity` (`INVALID_TARGET_COUNT`).
  - Rejects `frequency === 'CUSTOM_DAYS'` with empty `daysOfWeek` array with HTTP `422 Unprocessable Entity` (`INVALID_DAYS_OF_WEEK`).
* **API-07 (Data Isolation Boundary & Resource Enumeration)**:
  - Participant 1 creates a habit.
  - Participant 2 calls `GET /api/habits/:id` for Participant 1's habit ID.
  - Asserts HTTP `404 Not Found` (`code: "HABIT_NOT_FOUND"`).
  - Participant 2 calls `GET /api/habits`; asserts only Participant 2's habits are returned.
* **API-08 (Habit Update `PUT /api/habits/:id`)**:
  - Updates habit title and target count; asserts HTTP `200 OK` and updated fields.
  - Rejects update with invalid color (`422`).
  - Rejects update on other participant's habit (`404 Not Found`).
* **Soft Archive (`DELETE /api/habits/:id`)**:
  - Calls `DELETE /api/habits/:id`; asserts HTTP `204 No Content`.
  - Verifies database record has `isActive: false`.
  - Rejects delete on other participant's habit with HTTP `404 Not Found`.
* **Program Manager Role Barrier**:
  - Calling `POST /api/habits` or `GET /api/habits` with a `PROGRAM_MANAGER` session token returns HTTP `403 Forbidden` (`code: "PARTICIPANT_ROLE_REQUIRED"`).

#### 6.2.2. `tracking.api.test.ts` (Mapped to **API-09**)
* **Check Habit Completion**:
  - `POST /api/tracking/log` with `{ habitId, date, completed: true }`.
  - Asserts HTTP `200 OK`, `HabitLog` record created.
* **Idempotency Verification**:
  - Second `POST /api/tracking/log` with identical payload returns HTTP `200 OK` without error or duplicate record.
* **Uncheck Habit Completion**:
  - `POST /api/tracking/log` with `{ habitId, date, completed: false }`.
  - Asserts HTTP `200 OK`, `HabitLog` record removed/uncompleted.
* **Future Date Validation**:
  - `POST /api/tracking/log` with date 5 days in the future.
  - Asserts HTTP `422 Unprocessable Entity` (`INVALID_LOG_DATE`).
* **Malformed Date String Validation**:
  - `POST /api/tracking/log` with invalid date string `"not-a-date"`.
  - Asserts HTTP `422 Unprocessable Entity` (`INVALID_DATE_FORMAT`).
* **Archived Habit Rejection**:
  - `POST /api/tracking/log` on a soft-archived habit (`isActive: false`).
  - Asserts HTTP `422 Unprocessable Entity` (`code: "HABIT_ARCHIVED"`).
* **Cross-User Ownership**:
  - Attempting to log for another user's habit returns HTTP `404 Not Found` (`code: "HABIT_NOT_FOUND"`).
* **Program Manager Role Barrier**:
  - Calling `POST /api/tracking/log` or `GET /api/tracking/today` with a `PROGRAM_MANAGER` session token returns HTTP `403 Forbidden` (`code: "PARTICIPANT_ROLE_REQUIRED"`).

---

### 6.3. UI Component Tests (`client/tests/sprint-01/`)

#### 6.3.1. `ColorPicker.test.tsx` (Mapped to **UI-02**)
* Renders exactly 8 circular color swatch buttons.
* Highlights the currently selected color with visual focus ring / checkmark.
* Clicking a swatch invokes `onChange` callback with the selected hex code.
* Supports keyboard navigation (`Tab`, `Space`, `Enter`).

#### 6.3.2. `TodayChecklist.test.tsx` (Mapped to **UI-03**)
* Renders today's habit list with color strips, titles, and frequency tags.
* Displays completion tally correctly (e.g. `"1 of 3 habits completed today"`).
* Renders checked habits with checkmark `✓` and strike-through text.
* Clicking an unchecked checkbox toggles it optimistically and calls `POST /api/tracking/log`.
* Reverts state and announces error if API toggle fails.
* Renders empty state message when no habits are scheduled.

#### 6.3.3. `DashboardPlaceholder.test.tsx` (Mapped to **UI-08**)
* Renders the under-construction placeholder card when accessing `/dashboard`.
* Verifies that the page announces and displays the toast notification *"Dashboard is still under construction"* (`aria-live="polite"`).
* Verifies the "Go to Habit Calendar" button routes cleanly back to `/calendar`.

---

### 6.4. End-to-End Test (`e2e/sprint-01/participant-journey.spec.ts`)
* **Mapped to E2E-01 (Participant Workflow & Calendar Integration)**:
  1. Participant logs in and lands on the Habit Calendar (`/calendar`).
  2. Clicks `+ New Habit` button to open modal.
  3. Fills in title `"Morning Hydration"`, selects color `#009688` (Verdigris), frequency `DAILY`, target count `30`.
  4. Clicks `"Save Habit"`.
  5. Modal closes; verifies `"Morning Hydration"` appears in the side daily habits list and calendar row with `#009688` color styling.
  6. In the illuminated active day column on the calendar, clicks the completion cell for `"Morning Hydration"`.
  7. Verifies the cell turns `#009688` with a checkmark `✓`.
  8. Clicks "Dashboard" in the header navigation and verifies the popup notification displays: *"Dashboard is still under construction"*.

---

### 6.5. Responsive & Viewport Verifications
* **Desktop (&ge; 992px)**: Unified Habit Calendar desktop view with sticky left side daily habits panel (`HABITS`), illuminated active day column, right goals anchor, and bottom notes anchor. Modal centered at `520px`.
* **Tablet (768px – 991px)**: Horizontal scroll container for calendar columns; margins scale to `1rem`; touch targets remain &ge; 44px.
* **Mobile (< 768px)**:
  - Header collapses to hamburger drawer with direct links to "Habit Calendar" and "Dashboard".
  - Calendar switches to a stacked vertical flow of daily habits with large &ge; 44px touch targets in the active day column.
  - Modal expands to `95%` screen width with zero horizontal overflow.
  - Responsive toast notification displayed when accessing `/dashboard`.

---

## 7. Reconciliations, Ambiguities & Open Questions

During contract specification, five cross-document discrepancies were analyzed and reconciled:

1. **Description Character Limit (500 vs. 1000 characters)**:
   - *Conflict*: `docs/sprint-01/api-spec.md` (line 245) and `docs/sprint-01/ui-spec.md` (line 187) mandate a maximum length of **500 characters** for habit descriptions, whereas early drafts of `specification.md` BR-04 referenced 1000 characters.
   - *Resolution*: Standardized across all layers to **500 characters** (`max: 500`). This maintains UI card layout stability on mobile viewports and avoids unnecessary text bloat in the database.
2. **`PUT /api/habits/:id` Lifecycle (Feature 2 Backend vs. Feature 3 UI)**:
   - *Conflict*: `api-spec.md` specifies `PUT /api/habits/:id` for editing habit details, but the in-calendar edit UI is deferred to Feature 3 (`Screen 3` Daily Calendar Desktop).
   - *Resolution*: The `PUT /api/habits/:id` endpoint is implemented and verified via backend API integration tests (`API-08`) in Feature 2, while the UI invocation modal is integrated into the calendar matrix in Feature 3. In Feature 2, the frontend modal focuses purely on habit creation (`POST /api/habits`).
3. **`notes` Field on Habit Completion Logging**:
   - *Conflict*: The `HabitLog` database model contains an optional `notes String?` column, and `POST /api/tracking/notes` is part of Feature 3 calendar reflection notes.
   - *Resolution*: In Feature 2, `POST /api/tracking/log` supports an optional `notes` field in the request DTO, but the `Screen 2` Today's Checklist UI provides a streamlined single-click check/uncheck experience without demanding notes. The reflection notes stream and `+ New Note` UI remain deferred to Feature 3.
4. **Habit Palette Color Set (8 Habit Colors vs. 5 Theme Colors)**:
   - *Clarification*: The HabitLess design system distinguishes between:
     - **Website Theme Palette** (5 tokens): Walnut `#724319`, Light Coral `#d88180`, Powder Blush `#f7b1b0` (background), Papaya Whip `#feeac7` (borders/accents), and Golden Sand `#cad182`.
     - **Selectable Habit Palette** (8 tokens approved in `specification.md` FR-05/BR-02 and user brief): Blue Energy `#448aff`, Ocean Deep `#1565c0`, Verdigris `#009688`, Yellow Green `#8bc34a`, Amber Gold `#ffc107`, Amber Glow `#ff9800`, Cinnabar `#f44336`, and Cherry Rose `#ad1457`.
   - *Resolution*: The habit creation modal swatches and backend validation strictly enforce the **8 fixed habit palette colors**, keeping habit categorization visually distinct from website navigation chrome.
5. **Standardized Resource Enumeration Defense (`404 Not Found`)**:
   - *Resolution*: All single-resource habit endpoints (`GET /api/habits/:id`, `PUT /api/habits/:id`, `DELETE /api/habits/:id`, and `POST /api/tracking/log` on unowned habit IDs) strictly return HTTP `404 Not Found` (`code: "HABIT_NOT_FOUND"`, message: `"Habit not found."`) to prevent malicious cross-user ID enumeration.
6. **Recurrence Evaluation Rules for `MONTHLY` & `CUSTOM_DAYS`**:
   - *Resolution*: Formally specified in §4.2.2 and §4.3.1. `MONTHLY` recurs when `queryDate.getUTCDate() === startDate.getUTCDate()`. `CUSTOM_DAYS` mandates a non-empty `daysOfWeek` array; empty arrays are rejected with HTTP `422 INVALID_DAYS_OF_WEEK`.
7. **Timezone Fidelity & UTC Normalization**:
   - *Resolution*: The client explicitly passes `?date=YYYY-MM-DD` derived from local browser time (`new Date().toLocaleDateString('en-CA')`). The backend normalizes the date to UTC midnight (`YYYY-MM-DDT00:00:00.000Z`) for consistent database lookups.
8. **Archived Habit Completion Guard**:
   - *Resolution*: Toggling a completion log on a soft-archived habit (`isActive: false`) returns HTTP `422 Unprocessable Entity` (`code: "HABIT_ARCHIVED"`).
9. **Modal Accessibility & Focus Restoration (WCAG 2.4.3)**:
   - *Resolution*: Dismissing or submitting the `+ New Habit` modal programmatically restores focus to the `+ New Habit` trigger button.
10. **Unified Habit Calendar Architecture vs. Separate Dashboard Page**:
    - *Resolution*: Reconciled per user clarification. The daily habits and the habit calendar desktop are **not separate pages**. The primary participant screen is the Habit Calendar (`/calendar`), featuring a side list of daily habits scheduled for that day, a top date indicator that lights up which column/day is editable to check habits, and interactive completion checkmark pills in that illuminated column. The secondary screen `/dashboard` is under construction in Sprint 1 MVP and triggers an accessible notification popup stating: *"Dashboard is still under construction"*.

