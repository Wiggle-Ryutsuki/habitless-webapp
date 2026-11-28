# Feature 7 Engineering Contract: Habits Directory, Completion Heatmap & Streaks

**Feature ID**: FEATURE-HL-07  
**Target Branch**: `feature/7-habit-stats-heatmap`  
**Base Branch**: `app/sprint-02` (or `staging-2`, after Features 5 and 6 merge)  
**Status**: Approved for Implementation  
**Version**: 1.2  
**Sprint Alignment**: Sprint 2 (Increment 3 of 5)  
**Parent Specifications**:
- [`docs/sprint-02/specification.md`](../../sprint-02/specification.md) (`SPEC-HL-02`, v1.0)
- [`docs/sprint-02/api-spec.md`](../../sprint-02/api-spec.md) (`API-SPEC-HL-02`, v1.0)
- [`docs/sprint-02/ui-spec.md`](../../sprint-02/ui-spec.md) (`UI-SPEC-HL-02`, v1.0)
- [`docs/sprint-02/tests.md`](../../sprint-02/tests.md) (`TEST-HL-02`, v1.0)
- [`docs/sprint-02/habitless_sprint2_draft.pdf`](../../sprint-02/habitless_sprint2_draft.pdf) (p. 2)
- [`docs/feature-contracts/feature-05/contract.md`](../feature-05/contract.md) (`FEATURE-HL-05`, v1.3)
- [`docs/feature-contracts/feature-06/contract.md`](../feature-06/contract.md) (`FEATURE-HL-06`, v1.1)

---

## 1. Purpose, Scope, and Explicit Exclusions

### 1.1. Purpose & Deliverables
Feature 7 delivers the **All Habits Directory** (`/habits`), the **Individual Habit Statistics Page** (`/habits/:id/stats`), and the backing streak & heatmap computation engine (`GET /api/habits/:id/stats`), building directly on the post-Feature-6 baseline (`Habit.category`, Sprint 1 fixed 8-color palette `colorHex`, and live Participant `Header.tsx` navigation links).

It delivers four cohesive capabilities:
1. **All Habits Directory Page (`client/src/pages/HabitsDirectoryPage.tsx` — `FR-S2-07`, `UI-S2-04`)**:
   - Lists all active participant habits (`GET /api/habits?status=active`) as a vertical list with client-side search (title/description) and category filter (`All`, `Uncategorized`, presets, custom labels).
   - Each habit list row displays its Sprint 1 palette color swatch (`colorHex`), title, category pill (`"Uncategorized"` fallback when `null`), and frequency summary (`getFrequencyLabel` / `Monthly` fallback), navigating on click/select to `/habits/:id/stats`.
2. **Streak & Heatmap Calculation Utility (`server/src/utils/habit-stats.ts` — `BR-S2-05`, `UT-S2-02`)**:
   - Pure computation module evaluating `currentStreak`, `highestStreak`, **Month Mode** daily cells (`0` / `1.0` opacity), and **Year Mode** chronological 365/366-day GitHub/AniList contribution grid cells (`weekday` `1..7`, `weekIndex` `0..52`, `month` `1..12`, `0` unlogged/future vs. `1.0` completed opacity).
3. **Per-Habit Statistics API (`GET /api/habits/:id/stats` — Endpoint ID `API-S2-02`)**:
   - Added to `server/src/controllers/habits.controller.ts` (or dedicated stats controller handler) and registered in `server/src/routes/habits.routes.ts` under `PARTICIPANT` RBAC, validating ownership and active status (`isActive === true`, otherwise `404 HABIT_NOT_FOUND`).
4. **Individual Habit Statistics Page (`client/src/pages/HabitStatsPage.tsx` — `FR-S2-08`, `FR-S2-09`, `UI-S2-04`) & Routes (`client/src/App.tsx`)**:
   - Registers `/habits` and `/habits/:id/stats` in `client/src/App.tsx` guarded by `ProtectedRoute allowedRoles={['PARTICIPANT']}` (matching the `/habits` nav link already enabled in `Header.tsx` during Feature 6).
   - Displays a **Back to Habits** link (`/habits`), habit metadata header (color chip, title, category pill, frequency summary), **Current Streak** & **Highest Streak** counters, and the toggleable **Month | Year Completion Heatmap** shaded in the habit's assigned Sprint 1 palette `colorHex`.

### 1.2. Explicit Exclusions (Strict Scope Boundary)
All capabilities outside Feature 7 are strictly excluded from `feature/7-habit-stats-heatmap`:

* **No Feature 5 / Feature 6 Re-work & Preserved Sprint 1 Palette (`FR-05`, `BR-02`)**:
  - Customizable Habit Colors remain deferred; `palette-validator.ts` and `ColorPicker.tsx` remain untouched. Heatmaps strictly shade completed squares using the habit's assigned Sprint 1 palette `colorHex` (`opacity: 1.0`) and unlogged/future squares as subtle neutral empty tiles (`opacity: 0`).
  - Do not modify Feature 5 modals (`NewHabitModal.tsx`, `EditHabitModal.tsx`, `HabitQuickViewModal.tsx`, `CalendarMatrix.tsx`) or Feature 6 (`DashboardPage.tsx`, `dashboard-calc.ts`, `GET /api/tracking/dashboard`).
* **Excluded Feature 8 (`feature/8-challenges-hub-sync`)**:
  - Challenges Hub (`/challenges`, `ChallengesHubPage.tsx`), `GET /api/challenges`, search/filtering, enrollment status transitions (`ACTIVE` / `LEFT` / `COMPLETED`), Prisma schema columns (`Habit.sourceActivityId`, `Habit.challengeStatus`, `Habit.syncedVersion`, `ChallengeProgram.version`, `hasTemplateEditsSincePublish`), `"Challenge"` / `"Challenge (Ended)"` badges on directory/calendar/stats pages, Keep vs. Remove prompt, `"Update Available"` / `"Sync Changes"`, and challenge ratings/comments (`ChallengeRating`, `ChallengeComment`).
* **Excluded Feature 9 (`feature/9-manager-analytics-directory`)**:
  - Program Manager Analytics Dashboard (`/manager/dashboard`), Global Challenges Directory (`/manager/challenges`), Read-Only Challenge Detail View (`/manager/challenges/:id`), In-Place Challenge Layout Preview (`FR-S2-17` / `UI-S2-09`), Program Manager `Header.tsx` updates, and comment replies.
* **Excluded Sprint 1 Deferred Items & Unchanged Files**:
  - No changes to `AuthForm.tsx`, `/api/auth/*`, `/api/health`, `/api/ready`, `DailyNote` CRUD (`/api/tracking/notes`), `ProgramBuilder.tsx`, `Dockerfile`s, or removing `MONTHLY` from `VALID_FREQUENCIES` in `habits.controller.ts`.

---

## 2. Requirements & Acceptance Criteria Traceability

| ID | Category | Description | Feature-7 Implementation Target |
| :--- | :--- | :--- | :--- |
| **FR-S2-07** | Functional | All Habits Directory & Habit Stats Navigation | `HabitsDirectoryPage.tsx` (`/habits`) listing active participant habits (`GET /api/habits?status=active`) with search/category filtering, swatch, title, category pill, frequency summary, and navigation to `/habits/:id/stats`; routes registered in `App.tsx`. |
| **FR-S2-08** | Functional | Per-Habit Completion Heatmap | `habit-stats.ts` + `GET /api/habits/:id/stats` + `HabitStatsPage.tsx` toggleable **Month** compact 7-column daily square matrix (`0` / `1.0` opacity) and **Year** GitHub/AniList-style 7-row × 53-column daily contribution grid covering all 365/366 days (`0` unlogged/future neutral empty square vs. `1.0` completed opacity in `habit.colorHex`). |
| **FR-S2-09** | Functional | Per-Habit Streak Counters | `habit-stats.ts` + `GET /api/habits/:id/stats` + `HabitStatsPage.tsx` **Current Streak** and **Highest Streak** counters skipping non-due days. |
| **BR-S2-05** | Business Rule | Streak & Heatmap Calculation Invariants | Date evaluation bounded by `<= anchorToday` within `[startDate, endDate]`; non-due days never increment or break streaks; chronological 365/366-day Year contribution grid (`weekday` `1..7`, `weekIndex` `0..52`, `month` `1..12`, binary `0` / `1.0` opacity). |
| **FR-05 / BR-02** *(Preserved)* | Sprint 1 Baseline | Fixed 8-Color Palette Shading | Heatmaps use the habit's assigned Sprint 1 palette `colorHex`; no custom color pickers or arbitrary hexes are introduced. |
| **Endpoint ID `API-S2-02` / Test ID `API-S2-03`** | API & Test Traceability | `GET /api/habits/:id/stats` | Endpoint ID **`API-S2-02`** (`docs/sprint-02/api-spec.md` Sec. 3.1) implemented in `habits.controller.ts` + `habits.routes.ts`; covered by Test ID **`API-S2-03`** (`docs/sprint-02/tests.md` Sec. 2.2) in `server/tests/sprint-02/habit-stats.api.test.ts`. |
| **UI-S2-04** | UI Specification | Habits Directory & Individual Stats View | `HabitsDirectoryPage.tsx`, `HabitStatsPage.tsx`, `fetchHabitStats` in `habits.service.ts`, DTOs in `habit.ts`. |
| **AC-S2-05** | Acceptance | Directory, Heatmaps & Streaks | Navigating `/habits` -> clicking a habit -> `/habits/:id/stats` renders accurate Current/Highest Streaks and toggles between Month and Year heatmaps in the habit's `colorHex`. |
| **UT-S2-02, UI-S2-04, E2E-S2-01** | Verification | Unit, UI & Full Participant Journey | `server/tests/sprint-02/stats.test.ts`, `client/tests/sprint-02/HabitStats.test.tsx`, `e2e/sprint-02/participant-customization-stats.spec.ts`. |

---

## 3. Data Design & Calculation Invariants (`BR-S2-05`)

### 3.1. Database Schema Status (Zero Migration Required)
Feature 7 requires **no Prisma schema changes or migrations**. It queries existing models established in Sprint 1 and Feature 5 (`server/prisma/schema.prisma`):
- **`Habit`**: Uses `id`, `userId`, `title`, `description`, `category` (nullable `VarChar(50)` from Feature 5), `colorHex`, `frequency`, `daysOfWeek` (`Int[]`), `startDate`, `endDate`, `targetCount`, `isActive`, `programId`.
- **`HabitLog`**: Uses `habitId`, `logDate` (`@db.Date`), `completed`.

> **Feature 8 Schema Independence Note**: `Habit.challengeStatus` (`ACTIVE | ENDED`) is not added until Feature 8. In Feature 7, `HabitStatsPage.tsx` and `HabitsDirectoryPage.tsx` omit Feature 8 `"Challenge"` / `"Challenge (Ended)"` status badges, and `challengeStatus` is omitted from the `GET /api/habits/:id/stats` `habit` DTO until Feature 8 adds the schema column.

### 3.2. Pure Calculation Module (`server/src/utils/habit-stats.ts`)

#### A. Shared Normalization & Evaluation Bounds
* **Anchor Today (`anchorTodayStr`)**: Optional `date` (`YYYY-MM-DD`, validated via `isValidIsoDateString` from `dashboard-calc.ts`; defaults to UTC today). Normalized as `anchorToday = toUtcMidnight(anchorTodayStr)`.
* **Habit Active Schedule Window**:
  * `habitStart = toUtcMidnight(habit.startDate)`
  * `effectiveStreakEnd = habit.endDate ? min(anchorToday, toUtcMidnight(habit.endDate)) : anchorToday`
  * Completed log lookup: `completedSet = Set<string>` of `YYYY-MM-DD` keys from `logs` where `completed === true`.
  * Daily schedule predicate: reuses `isHabitScheduledForDate(habit, date)` (`server/src/utils/frequency.ts`).

#### B. Streak Calculations (`currentStreak` & `highestStreak`)
If `habitStart > effectiveStreakEnd`, both `currentStreak` and `highestStreak` equal `0`. Otherwise:

1. **Highest Streak (`highestStreak`)**:
   - Iterate every calendar date `d` from `habitStart` through `effectiveStreakEnd` inclusive:
     - If `!isHabitScheduledForDate(habit, d)`: skip (non-due days neither increment nor break streaks).
     - Else if `completedSet.has(toUtcDateKey(d))`: increment `runningStreak` and update `highestStreak = max(highestStreak, runningStreak)`.
     - Else: reset `runningStreak = 0`.
2. **Current Streak (`currentStreak`)**:
   - Starting from `cursor = effectiveStreakEnd` walking backward toward `habitStart`:
     - **Anchor-Day Grace Rule (`BR-S2-05`)**: If `cursor` equals `anchorToday`, `isHabitScheduledForDate(habit, anchorToday)` is `true`, and `!completedSet.has(anchorTodayStr)`, do **not** immediately break the streak to `0`; step back to `anchorToday - 1 day` and count consecutive completed due days ending yesterday. *(If today IS completed, include today in the streak).*
     - For any date `< anchorToday` (or `<= effectiveStreakEnd` when `habit.endDate < anchorToday`):
       - If `!isHabitScheduledForDate(habit, cursor)`: skip backward (non-due day).
       - Else if `completedSet.has(toUtcDateKey(cursor))`: increment `currentStreak` and continue backward.
       - Else: stop loop immediately (a missed past scheduled due day ends the current streak).
   - Edge cases:
     - Brand-new habit with `0` completed logs -> `currentStreak = 0`, `highestStreak = 0`.
     - Missed day breaks streak -> `currentStreak` reflects only post-gap consecutive completions while `highestStreak` retains the earlier peak.

#### C. Month Mode Heatmap (`mode === 'month'`)
* **Target Period**: `year` (default `anchorToday.getUTCFullYear()`) and `month` `1..12` (default `anchorToday.getUTCMonth() + 1`).
* **Cells**: Exactly `daysInMonth(year, month - 1)` daily cells ordered `1..daysInMonth`:
  * `key`: `'YYYY-MM-DD'`
  * `label`: String(dayNumber) (`'1'`..`'31'`)
  * `scheduled`: `boolean` (`isHabitScheduledForDate(habit, dayDate)`)
  * `scheduledCount`: `scheduled ? 1 : 0`
  * `completedCount`: `completedSet.has(key) ? 1 : 0` (renders completion on any date with a `completed: true` `HabitLog`, including off-day completions, while `scheduled` accurately reflects `isHabitScheduledForDate`)
  * `opacity`: `completedSet.has(key) ? 1.0 : 0` (`0%` vs `100%` opacity in `habit.colorHex`).

#### D. Year Mode Heatmap (`mode === 'year'`)
* **Target Period**: `year` (default `anchorToday.getUTCFullYear()`).
* **Grid Alignment (`7 Rows × ~53 Columns`)**:
  * Computes `jan1Weekday = (jan1.getUTCDay() === 0 ? 7 : jan1.getUTCDay())` (`1 = Mon`..`7 = Sun`) and `leadingSpacers = jan1Weekday - 1` (`0..6`).
  * Returns **all 365/366 daily cells** (`Jan 1` through `Dec 31` of `year`) ordered chronologically (`YYYY-MM-DD`):
    - `key`: `'YYYY-MM-DD'`
    - `label`: String(dayNumber) (`'1'`..`'31'`)
    - `weekday`: ISO day `1..7` (`1 = Mon`..`7 = Sun`)
    - `weekIndex`: `Math.floor((leadingSpacers + dayIndex0) / 7)` (`0..52`, or `53` in Sunday-start leap years)
    - `month`: `1..12`
    - `scheduled`: `boolean` (`isHabitScheduledForDate(habit, dayDate)`)
    - `scheduledCount`: `scheduled ? 1 : 0` (`0 | 1`)
    - `completedCount`: `dayDate <= anchorToday && completedSet.has(key) ? 1 : 0` (`0 | 1`)
    - `opacity`: `completedCount === 1 ? 1.0 : 0` (`0` for unlogged or future days rendered as neutral empty squares; `1.0` for completed days shaded in `habit.colorHex`).

---

## 4. API Contract (`GET /api/habits/:id/stats` — Endpoint ID `API-S2-02` / Test ID `API-S2-03`)

### 4.1. Endpoint, RBAC & Ownership Guard
* **Route**: `GET /api/habits/:id/stats` (registered on `server/src/routes/habits.routes.ts`)
* **Middleware**: `requireAuth`, `requireRole([Role.PARTICIPANT], 'PARTICIPANT_ROLE_REQUIRED')`
* **Access & Ownership Statuses**:
  * `401 UNAUTHORIZED` — unauthenticated request
  * `403 PARTICIPANT_ROLE_REQUIRED` — authenticated as `PROGRAM_MANAGER`
  * `404 HABIT_NOT_FOUND` — invalid non-integer `:id`, habit does not exist, `habit.userId !== req.user.id`, or `habit.isActive === false` (soft-archived)

### 4.2. Query Parameters & Validation (`422 Unprocessable Entity`)
| Parameter | Type & Default | Validation Rule | Error Code |
| :--- | :--- | :--- | :--- |
| `mode` | Optional `'month' \| 'year'`, default `'month'` | Must be `'month'` or `'year'` if supplied. | `422 INVALID_STATS_MODE` |
| `month` | Optional integer `1..12`, default month of `date` | Validated when provided (and used in `month` mode): integer `1..12`. | `422 INVALID_MONTH` |
| `year` | Optional integer `1900..2100`, default year of `date` | Validated when provided: integer `1900..2100`. | `422 INVALID_YEAR` |
| `date` | Optional `YYYY-MM-DD`, default current UTC date | Strict `isValidIsoDateString(date)` (rejects malformed/rollovers like `2026-02-31`). | `422 INVALID_DATE_FORMAT` |

Error payload follows `server/src/middleware/errorHandler.ts`:
```json
{
  "error": {
    "code": "INVALID_STATS_MODE",
    "message": "Mode must be either 'month' or 'year'.",
    "correlationId": "hl-req-..."
  }
}
```

### 4.3. Response `200 OK` DTO (`API-SPEC-HL-02` Sec. 3.1)
#### Month Mode Example (`?mode=month&month=11&year=2026&date=2026-11-26`)
```json
{
  "habit": {
    "id": 101,
    "title": "Journal",
    "description": "Daily reflection before bed",
    "category": "Mindfulness",
    "colorHex": "#ff9800",
    "frequency": "DAILY",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": null,
    "targetCount": 20,
    "programId": null
  },
  "streaks": {
    "currentStreak": 5,
    "highestStreak": 12
  },
  "heatmap": {
    "mode": "month",
    "month": 11,
    "year": 2026,
    "cells": [
      {
        "key": "2026-11-01",
        "label": "1",
        "scheduled": true,
        "completedCount": 1,
        "scheduledCount": 1,
        "opacity": 1.0
      }
    ]
  }
}
```

#### Year Mode Example (`?mode=year&year=2026&date=2026-11-26`)
```json
{
  "habit": {
    "id": 101,
    "title": "Journal",
    "description": "Daily reflection before bed",
    "category": "Mindfulness",
    "colorHex": "#ff9800",
    "frequency": "DAILY",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": null,
    "targetCount": 20,
    "programId": null
  },
  "streaks": {
    "currentStreak": 5,
    "highestStreak": 12
  },
  "heatmap": {
    "mode": "year",
    "month": null,
    "year": 2026,
    "cells": [
      {
        "key": "2026-11-01",
        "label": "1",
        "weekday": 7,
        "weekIndex": 43,
        "month": 11,
        "scheduled": true,
        "completedCount": 1,
        "scheduledCount": 1,
        "opacity": 1.0
      }
    ]
  }
}
```

### 4.4. Client Service & Types (`client/`)
* **`client/src/types/habit.ts`**: Add `HabitHeatmapCell`, `HabitHeatmapData`, `HabitStreakSummary`, and `HabitStatsResponse` (`habit` fields + `streaks` + `heatmap`).
* **`client/src/services/habits.service.ts`**: Add `fetchHabitStats(habitId: number, options?: { mode?: 'month' | 'year'; month?: number; year?: number; date?: string }): Promise<HabitStatsResponse>` calling `GET /api/habits/:id/stats` via `handleResponse`.

---

## 5. UI Specification & Component States (`UI-S2-04`)

### 5.1. Visual Design Tokens (`client/src/styles/theme.css`)
All Feature 7 components use the Warm Natural Shell tokens (`UI-SPEC-HL-02` Sec. 1):
* `--walnut: #724319` (page headings, Back link, active `[ Month ] | [ Year ]` toggle button, streak card borders/values)
* `--light-coral: #d88180` (secondary borders, error highlights)
* `--powder-blush: #f7b1b0` (page background canvas)
* `--papaya-whip: #feeac7` (card borders, category pills, unlogged heatmap borders)
* `--golden-sand: #cad182` (frequency pills / achievement accents)
* **Habit Color Shading**: Completed heatmap tiles shade directly using `habit.colorHex` (`opacity: 1.0`); unlogged/future tiles render as subtle neutral empty squares (`#efe6da` / `var(--papaya-whip)` tint, `opacity: 0` fill overlay).

### 5.2. `HabitsDirectoryPage.tsx` (`/habits`) & `App.tsx` Routing
* **`client/src/App.tsx`**:
  * Register `<Route path="/habits" element={<ProtectedRoute allowedRoles={['PARTICIPANT']}><HabitsDirectoryPage /></ProtectedRoute>} />`
  * Register `<Route path="/habits/:id/stats" element={<ProtectedRoute allowedRoles={['PARTICIPANT']}><HabitStatsPage /></ProtectedRoute>} />`
* **`HabitsDirectoryPage.tsx`**:
  * Fetches active habits via existing `fetchHabits('active')` (`GET /api/habits?status=active`).
  * Renders search input (`aria-label="Search habits"`) and category filter `<select aria-label="Filter by category">` (`All Categories`, `Uncategorized`, plus categories derived from `HABIT_CATEGORY_PRESETS` and any user custom categories).
  * Each habit list row displays Sprint 1 palette swatch (`habit.colorHex`), title, category pill (`habit.category || 'Uncategorized'`), and frequency summary (`habit.frequency === 'MONTHLY' ? 'Monthly' : getFrequencyLabel(getInitialDaysOfWeek(habit.frequency, habit.daysOfWeek))`), plus a clear `"View Stats"` outlined button navigating to `/habits/${habit.id}/stats`.
  * Note: Feature 8 `"Challenge"` / `"Challenge (Ended)"` badges are deferred to Feature 8.

### 5.3. `HabitStatsPage.tsx` (`/habits/:id/stats`)
1. **Header & Navigation**:
   - **Back** link/button (`Link to="/habits"`, `"← Back to Habits"`).
   - Color swatch chip (`habit.colorHex`), Habit Title (`<h1>`), Category pill (`habit.category || 'Uncategorized'`), and Frequency pill.
2. **Streak Counters (`FR-S2-09`)**:
   - Two metric cards:
     - **Current Streak**: `${streaks.currentStreak} ${streaks.currentStreak === 1 ? 'day' : 'days'}`
     - **Highest Streak**: `${streaks.highestStreak} ${streaks.highestStreak === 1 ? 'day' : 'days'}`
3. **Completion Heatmap (`FR-S2-08`)**:
   - **Controls**: Segmented mode toggle (`Month` | `Year` buttons with `aria-pressed`) and period navigation arrows (`Previous Month` / `Next Month` in Month mode; `Previous Year` / `Next Year` in Year mode) displaying current label (e.g., `"November 2026"` or `"2026"`).
   - **Month Grid**: Compact 7-column daily square matrix (`Mon`–`Sun`) with leading weekday offset spacers so day numbers align to Mon–Sun columns cleanly; unlogged days render as subtle neutral empty squares (`#efe6da` / `0` opacity fill) and completed days render at `1.0` opacity in `habit.colorHex` with `title` and `aria-label` tooltips (`"YYYY-MM-DD: Completed"` or `"YYYY-MM-DD: Not completed"`).
   - **Year Grid (GitHub / AniList Contribution Matrix)**:
     - **7 Rows × ~53 Columns Matrix**: Rows represent `Mon` through `Sun` top to bottom with subtle `Mon`, `Wed`, `Fri` row labels on the left; columns flow left to right (`grid-auto-flow: column; grid-template-rows: repeat(7, 13px)`) across the 52–53 weeks of `year` with leading spacer cells before `Jan 1` so every square aligns to its exact day of the week.
     - **Month Headers**: `Jan`..`Dec` positioned across the top aligned with the first `weekIndex` column of each month.
     - **Square Tiles & Horizontal Scroll**: Crisp rounded squares (`13px × 13px`, `3px` gap, `3px` border-radius) inside an `overflowX: auto` wrapper so tiles never squish on mobile; unlogged/future squares render in neutral `#efe6da` (`opacity: 0`), completed squares render in `habit.colorHex` (`opacity: 1.0`), and hover/focus tooltips (`title` + `aria-label`) show `"YYYY-MM-DD: Completed"` or `"YYYY-MM-DD: Not completed"`.
   - **Heatmap Legend (Year Mode)**: Renders a compact legend (`Not completed` neutral square vs. `Completed` `habit.colorHex` square).

### 5.4. Component UI State Matrix

| Screen / State | Visual & Interactive Behavior |
| :--- | :--- |
| **`HabitsDirectoryPage` Loading** | Shows accessible `role="status"` loading indicator (`"Loading your habits..."`). |
| **`HabitsDirectoryPage` Empty / Filter Empty** | Zero active habits renders `"No habits yet"` with CTA link to `/calendar`; zero search/filter matches renders `"No habits match your filter"` with a **Clear Filters** button. |
| **`HabitsDirectoryPage` Error** | Renders `role="alert"` banner with **Retry** button (`minHeight: 44px`). |
| **`HabitStatsPage` Loading** | Renders `role="status"` loading message (`"Loading habit statistics..."`) on initial fetch or period/mode switch. |
| **`HabitStatsPage` Populated (0 Logs)** | Renders `Current Streak: 0 days`, `Highest Streak: 0 days`, and all heatmap cells at `opacity: 0` cleanly. |
| **`HabitStatsPage` `404` / Error** | If `GET /api/habits/:id/stats` fails with `HABIT_NOT_FOUND` (`404`), renders `"Habit not found"` card with **Back to Habits** link (`/habits`); transient errors show `role="alert"` with **Retry**. |

---

## 6. Software Test Specification

### 6.1. New Feature-7 Tests (`docs/sprint-02/tests.md` Sec. 2)

| Test ID | Tier | File Path | Key Assertions & Status Codes |
| :--- | :--- | :--- | :--- |
| **UT-S2-02** | Server Unit | `server/tests/sprint-02/stats.test.ts` | - Computes `currentStreak` and `highestStreak` across `DAILY`, `WEEKDAYS`, `THREE_TIMES_WEEKLY`, `CUSTOM_DAYS`, and `WEEKLY`, verifying non-due days never break streaks, unlogged `anchorToday` grace rule works, missed past scheduled day resets `currentStreak` while keeping `highestStreak`, and `0` logs yields `0 / 0`.<br>- Generates Month mode cells (`0` / `1.0` opacity) across leap-year February / 30 / 31-day months, including off-day `completed: true` logs rendering `opacity: 1.0` with `scheduled: false`.<br>- Generates all `365`/`366` Year mode daily cells (`Jan 1`–`Dec 31`) ordered chronologically with `weekday` (`1..7`), `weekIndex` (`0..52`), `month` (`1..12`), `completedCount`/`scheduledCount` (`0\|1`), and binary `opacity` (`0` unlogged/future, `1.0` completed). |
| **API-S2-03** *(Test ID; covers Endpoint ID `API-S2-02`)* | Server API | `server/tests/sprint-02/habit-stats.api.test.ts` | - `GET /api/habits/:id/stats?mode=month&month=11&year=2026&date=2026-11-26` returns `200 OK` with `habit`, `streaks`, and `heatmap` (`cells` length `30`, `opacity` `0`/`1.0`).<br>- `GET /api/habits/:id/stats?mode=year&year=2026&date=2026-11-26` returns `200 OK` with `month: null` and `365` daily cells (ordered chronologically) carrying `weekday`, `weekIndex`, `month`, `completedCount`/`scheduledCount` (`0\|1`), and `opacity` `0`/`1.0`.<br>- Rejects invalid `mode`/`month`/`year`/`date` with `422`.<br>- Returns `404 HABIT_NOT_FOUND` for missing, archived (`isActive: false`), or another participant's habit.<br>- Returns `401` unauthenticated and `403 PARTICIPANT_ROLE_REQUIRED` for `PROGRAM_MANAGER`. |
| **UI-S2-04** | Client UI | `client/tests/sprint-02/HabitStats.test.tsx` | - `HabitsDirectoryPage`: renders active habits with color swatch, category pill (`"Uncategorized"` fallback), frequency label, filters by search/category, and links to `/habits/:id/stats`; renders empty & retry states.<br>- `HabitStatsPage`: renders Back link to `/habits`, Current/Highest Streak counters, compact 7-column Month square matrix shaded in `habit.colorHex`, switches to Year mode (`fetchHabitStats` with `mode: 'year'`) rendering the 7-row × 53-column contribution grid (`Mon`/`Wed`/`Fri` labels, `Jan`–`Dec` month headers, leading Jan 1 offset spacers, hover/focus `title` + `aria-label` tooltips, legend), navigates periods (`Prev`/`Next`), and renders `404`/Retry error states. |
| **E2E-S2-01** | End-to-End | `e2e/sprint-02/participant-customization-stats.spec.ts` | - Full Participant Sprint 2 journey (combining merged Features 5, 6, and 7): Participant registers -> creates a habit on `/calendar` with Sprint 1 palette color + category -> clicks habit title to open Quick-View Card (`Back` / `Edit` / `Delete` soft-archive check on second habit) -> navigates to `/dashboard` to inspect Today's Focus, Weekly Habit Progress Bars, and toggle completion -> navigates via Header `Habits` to `/habits`, clicks habit card -> verifies `/habits/:id/stats` Current/Highest Streaks and toggles Month/Year heatmap. |

### 6.2. Responsive & Viewport Verifications
* **Desktop (`>= 992px`)**: `HabitsDirectoryPage` renders a structured vertical habit list cleanly; `HabitStatsPage` displays streak cards side-by-side and both the compact Month square matrix and 7×53 Year contribution grid fit cleanly within container width.
* **Tablet (`768px – 991px`)**: Directory list, compact 7-column Month matrix, and horizontally scrollable 7×53 Year grid keep crisp square tiles without distortion; Back, Month/Year toggle, and period arrows keep `>= 44px` touch targets.
* **Mobile (`< 768px`)**: Directory search/filter bar stacks to `1` column and habit list rows wrap pills/action cleanly; streak cards stack or fit cleanly in 2 compact columns; compact Month matrix remains legible and 7×53 Year grid scrolls horizontally inside `overflowX: 'auto'` without squishing individual squares or overlapping month/weekday labels.
