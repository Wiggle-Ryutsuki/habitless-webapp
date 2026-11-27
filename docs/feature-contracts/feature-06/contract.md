# Feature 6 Engineering Contract: Participant Dashboard & Weekly Progress

**Feature ID**: FEATURE-HL-06  
**Target Branch**: `feature/6-participant-dashboard`  
**Base Branch**: `app/sprint-02` (or `staging-2`, after Feature 5 merge)  
**Status**: Approved for Implementation  
**Version**: 1.1  
**Sprint Alignment**: Sprint 2 (Increment 2 of 5)  
**Parent Specifications**:
- [`docs/sprint-02/specification.md`](../../sprint-02/specification.md) (`SPEC-HL-02`, v1.0)
- [`docs/sprint-02/api-spec.md`](../../sprint-02/api-spec.md) (`API-SPEC-HL-02`, v1.0)
- [`docs/sprint-02/ui-spec.md`](../../sprint-02/ui-spec.md) (`UI-SPEC-HL-02`, v1.0)
- [`docs/sprint-02/tests.md`](../../sprint-02/tests.md) (`TEST-HL-02`, v1.0)
- [`docs/sprint-02/habitless_sprint2_draft.pdf`](../../sprint-02/habitless_sprint2_draft.pdf) (pp. 1–2)
- [`docs/feature-contracts/feature-05/contract.md`](../feature-05/contract.md) (`FEATURE-HL-05`, v1.3)

---

## 1. Purpose, Scope, and Explicit Exclusions

### 1.1. Purpose & Deliverables
Feature 6 replaces the Sprint 1 `"Dashboard Under Construction"` placeholder (`FR-07`, `UI-08`) with the live **Participant Dashboard** (`/dashboard`) and its backing analytics/focus API (`GET /api/tracking/dashboard`), building directly on the completed Sprint 1 baseline (`feature/1-auth-roles` through `feature/4-program-challenge`) and Feature 5 (`feature/5-habit-customization-quickview`).

It delivers four cohesive capabilities:
1. **Navigation Shell Update (`client/src/components/Header.tsx`)**:
   - Removes the Sprint 1 `"Dashboard is still under construction"` click toast (`triggerUnderConstruction`) from Participant desktop and mobile navigation.
   - Enables the Sprint 2 Participant navigation links: `Habit Calendar` (`/calendar`), `Dashboard` (`/dashboard`), `Habits` (`/habits`), and `Challenges` (`/challenges`).
   - *Incremental Route Decision*: `/calendar` and `/dashboard` are live for Participants in Feature 6. `/habits` and `/challenges` links are enabled in `Header.tsx` per `UI-SPEC-HL-02` Sec. 2 and intentionally fall through to the existing catch-all `* -> /calendar` redirect in `client/src/App.tsx` until Features 7 and 8 implement `HabitsDirectoryPage` and `ChallengesHubPage` (no temporary placeholder routes are created). Program Manager navigation (`Programs` `/manager` and Manager `Dashboard` under-construction link) and Manager `/dashboard` fallback remain intact until Feature 9 (`/manager/dashboard`, `/manager/challenges`).
2. **Participant Dashboard API (`GET /api/tracking/dashboard` — `API-S2-01`)**:
   - Computes and returns the Monday–Sunday week strip (`weekStart`, `weekEnd`, `weekDays[]`), Today's Focus Snippet (`todayFocus`), Weekly Habit Progress Bars (`weeklyProgress[]`), and global Program Completion Bar (`programCompletion`) for an authenticated `PARTICIPANT`.
3. **Live Participant Dashboard Page (`client/src/pages/DashboardPage.tsx` — `UI-S2-03`)**:
   - Replaces the Sprint 1 placeholder card and under-construction toast for Participants with:
     - **Section 1 — Today's Focus Snippet (`FR-S2-04`)**: Mon–Sun 7-day strip with `aria-current="date"` on today and interactive due-today habit items displaying color dot, category pill (`"Uncategorized"` fallback), and completion toggle (`POST /api/tracking/log`).
     - **Section 2 — Weekly Habit Progress Bars (`FR-S2-05`)**: Per-habit progress bars shaded in each habit's assigned Sprint 1 palette `colorHex` with `completedDaysThisWeek / scheduledDaysThisWeek` ratios.
     - **Section 3 — Program Completion Bar (`FR-S2-06`)**: Global `"Active Program Completion"` bar showing `totalCompletedLogs / totalScheduledDaysToDate` and percentage across active challenge-linked habits (`programId != null`).
4. **Server & Client Frequency Parity (`BR-S2-04`)**:
   - Ensures consistent Monday (`ISO 1`) through Sunday (`ISO 7`) evaluation between `server/src/utils/frequency.ts` and `client/src/components/DayOfWeekSelector.tsx` across Sprint 2 supported frequencies (`DAILY`, `WEEKDAYS`, `THREE_TIMES_WEEKLY`, `CUSTOM_DAYS`, `WEEKLY`).

### 1.2. Explicit Exclusions (Strict Scope Boundary)
All capabilities outside Feature 6 are strictly excluded from `feature/6-participant-dashboard`:

* **No Feature 5 Re-work / Preserved Sprint 1 Palette (`FR-05`, `BR-02`)**:
  - Customizable Habit Colors remain deferred; `server/src/utils/palette-validator.ts` and `client/src/components/ColorPicker.tsx` remain untouched. Dashboard dots and progress bars reuse Sprint 1 palette `colorHex` values and Feature 5's nullable `Habit.category`.
* **Excluded Feature 7 (`feature/7-habit-stats-heatmap`)**:
  - All Habits Directory (`/habits`, `HabitsDirectoryPage.tsx`), Individual Habit Statistics page (`/habits/:id/stats`, `HabitStatsPage.tsx`), `GET /api/habits/:id/stats`, Month/Year completion heatmaps, and Current/Highest Streak counters (`FR-S2-07`, `FR-S2-08`, `FR-S2-09`, `BR-S2-05`).
* **Excluded Feature 8 (`feature/8-challenges-hub-sync`)**:
  - Interactive Challenges Hub (`/challenges`, `ChallengesHubPage.tsx`), `GET /api/challenges`, search/filtering, enrollment status transitions (`ACTIVE` / `LEFT` / `COMPLETED`), Prisma columns `Habit.sourceActivityId` / `challengeStatus` / `syncedVersion`, `ChallengeProgram.version` / `hasTemplateEditsSincePublish`, `"Challenge"` / `"Challenge (Ended)"` badges, Leave Keep/Remove prompt, `"Update Available"` / `"Sync Changes"`, and challenge ratings/comments (`ChallengeRating`, `ChallengeComment`).
* **Excluded Feature 9 (`feature/9-manager-analytics-directory`)**:
  - Program Manager Analytics Dashboard (`/manager/dashboard`), Global Challenges Directory (`/manager/challenges`), Read-Only Challenge Detail View (`/manager/challenges/:id`), In-Place Challenge Layout Preview (`FR-S2-17` / `UI-S2-09`), Program Manager `Header.tsx` links (`Dashboard` `/manager/dashboard`, `Directory` `/manager/challenges`), and comment replies.
* **Excluded Sprint 1 Deferred Items & Unchanged Files**:
  - No changes to `AuthForm.tsx`, `/api/auth/*`, `/api/health`, `/api/ready`, `DailyNote` CRUD (`/api/tracking/notes`), `ProgramBuilder.tsx`, `CalendarMatrix.tsx`, `HabitQuickViewModal.tsx`, `Dockerfile`s, or removing `MONTHLY` from `VALID_FREQUENCIES` in `server/src/controllers/habits.controller.ts`.

---

## 2. Requirements & Acceptance Criteria Traceability

| ID | Category | Description | Feature-6 Implementation Target |
| :--- | :--- | :--- | :--- |
| **FR-S2-04** | Functional | Dashboard — Today's Focus Snippet | `GET /api/tracking/dashboard` (`weekDays`, `todayFocus`), `DashboardPage.tsx` Mon–Sun strip (`aria-current="date"`) and interactive due-today list (color dot, category pill, completion toggle, daily tally). |
| **FR-S2-05** | Functional | Dashboard — Weekly Habit Progress Bars | `GET /api/tracking/dashboard` (`weeklyProgress[]`), `DashboardPage.tsx` per-habit progress bars shaded in `colorHex` with `completedDaysThisWeek / scheduledDaysThisWeek` ratio. |
| **FR-S2-06** | Functional | Dashboard — Program Completion Bar | `GET /api/tracking/dashboard` (`programCompletion`), `DashboardPage.tsx` global `"Active Program Completion"` bar (`totalCompletedLogs / totalScheduledDaysToDate` and `%`). |
| **FR-07** *(Partially Superseded)* | Sprint 1 Baseline | Participant Dashboard Placeholder Removal | Removes `"Dashboard is still under construction"` click toast in `Header.tsx` for Participants and renders live Participant Dashboard (`UI-S2-03`); retains the non-API `PROGRAM_MANAGER` fallback card on `/dashboard` (`UI-08` scoped to Manager only) until Feature 9. |
| **BR-S2-04** | Business Rule | Mon–Sun Week & Supported Frequencies | ISO week (`1 = Mon` .. `7 = Sun`); supports Daily (`DAILY`), Certain Days (`WEEKDAYS`, `THREE_TIMES_WEEKLY`, `CUSTOM_DAYS`), and Weekly (`WEEKLY`) consistently across server (`frequency.ts`, `dashboard-calc.ts`) and client (`DayOfWeekSelector.tsx`). |
| **BR-S2-11** | Business Rule | Program Completion Bar Formula | Computes `totalCompletedLogs / totalScheduledDaysToDate` across active challenge-linked habits (`userId = req.user.id`, `isActive = true`, `programId != null`), bounded by `[habit.startDate, min(today, habit.endDate ?? today)]`. |
| **Endpoint ID `API-S2-01` / Test ID `API-S2-02`** | API & Test Traceability | `GET /api/tracking/dashboard` | Endpoint ID **`API-S2-01`** (`docs/sprint-02/api-spec.md`, `specification.md`) implemented in `tracking.controller.ts` + `tracking.routes.ts`; covered by Test ID **`API-S2-02`** (`docs/sprint-02/tests.md` Sec. 2.2) in `server/tests/sprint-02/dashboard.api.test.ts`. |
| **UI-S2-03** | UI Specification | `DashboardPage` & `Header` Shell | `client/src/pages/DashboardPage.tsx`, `client/src/components/Header.tsx`, `client/src/services/habits.service.ts`, `client/src/types/habit.ts`. |
| **AC-S2-04** | Acceptance | Participant Dashboard Overview | Visiting `/dashboard` renders Today's Focus Snippet inside the Mon–Sun strip, Weekly Habit Progress Bars across `DAILY`/certain-days/`WEEKLY`, and global Program Completion Bar. |

---

## 3. Data Design & Formula Invariants

### 3.1. Database Schema Status (Zero Migration Required)
Feature 6 requires **no Prisma schema changes or migrations**. It queries existing models established in Sprint 1 and Feature 5 (`server/prisma/schema.prisma`):
- **`Habit`**: Uses `id`, `userId`, `title`, `category` (nullable `VarChar(50)` added in Feature 5), `colorHex`, `frequency`, `daysOfWeek` (`Int[]`), `startDate`, `endDate`, `isActive`, `programId`.
- **`HabitLog`**: Uses `habitId`, `logDate` (`@db.Date`), `completed`.
- **`ChallengeProgram`**: Linked via `Habit.programId != null`.

> **Feature 8 Schema Independence Note**: `Habit.challengeStatus` (`ACTIVE | ENDED`) is introduced later in Feature 8 (`SPEC-HL-02` Sec. 5.1, Sec. 7). Therefore, in Feature 6, `programCompletion` identifies active challenge-linked habits strictly via `userId = req.user.id`, `isActive = true`, and `programId != null` (without referencing `challengeStatus`). Feature 8 extends this predicate once `challengeStatus` exists.

### 3.2. Pure Calculation Module (`server/src/utils/dashboard-calc.ts`)
Dashboard metrics are isolated in a pure, unit-testable helper module (`UT-S2-03`) invoked by `tracking.controller.ts`.

#### A. Date Anchor & Monday–Sunday Week Boundaries (`BR-S2-04`)
1. **Anchor Date (`todayStr`)**:
   - Optional query parameter `date` (`YYYY-MM-DD`). When omitted, defaults to current UTC date (`new Date().toISOString().split('T')[0]`).
   - Normalized anchor timestamp: `anchorDate = new Date(\`${todayStr}T00:00:00.000Z\`)`.
   - **Client Local-Date Alignment**: `DashboardPage.tsx` supplies the browser's local calendar date (`new Date().toLocaleDateString('en-CA')`, matching `TodayChecklist.tsx`) so `"today"` remains consistent across timezones.
2. **Monday–Sunday Week Bounds (`weekStart`, `weekEnd`, `weekDays[]`)**:
   - Using `isoDay = getIsoDayOfWeek(anchorDate)` (`1 = Mon` .. `7 = Sun`):
     - `weekStartDate = anchorDate - (isoDay - 1) days` (UTC Monday)
     - `weekEndDate = weekStartDate + 6 days` (UTC Sunday)
     - `weekStart` and `weekEnd` formatted as `YYYY-MM-DD`.
   - `weekDays` always contains 7 ordered entries (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`):
     - `date`: `YYYY-MM-DD`
     - `dayLabel`: `'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'`
     - `dayNumber`: UTC day-of-month (`1..31`)
     - `isToday`: `dayDateStr === todayStr`

#### B. Today's Focus Snippet (`todayFocus`)
1. Filter active habits (`isActive === true`) ordered by `createdAt ASC` where `isHabitScheduledForDate(habit, anchorDate) === true`.
2. Join `HabitLog` records matching `logDate === anchorDate` and `completed === true`.
3. `totalScheduled = items.length`; `completedCount = items.filter(i => i.isCompleted).length`.

#### C. Weekly Habit Progress Bars (`weeklyProgress[]`, `FR-S2-05`, `BR-S2-04`)
For each active habit (`isActive === true`) ordered by `createdAt ASC`:
1. **Scheduled Days This Week (`scheduledDaysThisWeek`)**:
   - Iterate all 7 days `d_1..d_7` from `weekStartDate` to `weekEndDate` inclusive and count days where `isHabitScheduledForDate(habit, d_i) === true`.
   - **Mid-Week Date Clamping**: `scheduledDaysThisWeek` clamps strictly to days actually scheduled within `[habit.startDate, habit.endDate]` during that Mon–Sun week (e.g., a `DAILY` habit starting Thursday has `scheduledDaysThisWeek = 4`), matching `isHabitScheduledForDate` (`frequency.ts`).
   - For active habits spanning all 7 days of the Mon–Sun week (`startDate <= weekStartDate` and `endDate` is `null` or `>= weekEndDate`):
     - `DAILY` = `7`
     - `WEEKDAYS` = `5` (`Mon..Fri`)
     - `THREE_TIMES_WEEKLY` = `daysOfWeek.length` (default `3`)
     - `WEEKLY` = `daysOfWeek.length` (default `1`)
     - `CUSTOM_DAYS` = `daysOfWeek.length` (`1..7`)
     - *(Existing Sprint 1 `MONTHLY` habits, if any, evaluate safely via `isHabitScheduledForDate` `MONTHLY` case without throwing).*
   - Habits with `scheduledDaysThisWeek === 0` (e.g., not started yet or ended before `weekStartDate`) are excluded from `weeklyProgress[]`.
2. **Completed Days This Week (`completedDaysThisWeek`)**:
   - Count days `d_i` in `[weekStartDate, weekEndDate]` where `isHabitScheduledForDate(habit, d_i) === true` and a `HabitLog` exists with `completed === true` (clamping `completedDaysThisWeek <= scheduledDaysThisWeek`).
3. **Percentage**:
   - `scheduledDaysThisWeek === 0 ? 0 : Math.min(100, Math.round((completedDaysThisWeek / scheduledDaysThisWeek) * 100))`

#### D. Program Completion Bar (`programCompletion`, `FR-S2-06`, `BR-S2-11`)
Evaluates all active challenge-linked habits (`isActive === true` and `programId != null`):
1. **`activeProgramsCount`**: Count of distinct non-null `programId` values across active challenge-linked habits (`0` if none).
2. **`totalScheduledDaysToDate`**:
   - For each challenge-linked habit:
     - `rangeStart = utcMidnight(habit.startDate)`
     - `rangeEnd = habit.endDate ? min(anchorDate, utcMidnight(habit.endDate)) : anchorDate`
     - If `rangeStart > rangeEnd`, contributes `0` scheduled days and `0` completed logs.
     - Otherwise iterate calendar dates `d` from `rangeStart` through `rangeEnd` inclusive, counting days where `isHabitScheduledForDate(habit, d) === true`.
3. **`totalCompletedLogs`**:
   - Across those habits and date windows `[rangeStart, rangeEnd]`, count `HabitLog` rows where `completed === true` and `isHabitScheduledForDate(habit, logDate) === true`.
4. **Zero-Denominator & Edge Cases**:
   - If `activeProgramsCount === 0` or `totalScheduledDaysToDate === 0`, return `{ activeProgramsCount, totalCompletedLogs: 0, totalScheduledDaysToDate: 0, percentage: 0 }`.
   - Otherwise `percentage = Math.min(100, Math.round((totalCompletedLogs / totalScheduledDaysToDate) * 100))`.

### 3.3. Server & Client Frequency Parity (`BR-S2-04`)
Verified against existing Sprint 1 implementations (`server/src/utils/frequency.ts` and `client/src/components/DayOfWeekSelector.tsx`):
- Both represent weekdays with ISO-8601 (`1 = Mon .. 7 = Sun`).
- `frequency.ts` evaluates `WEEKDAYS` via `isoDay >= 1 && isoDay <= 5` and `THREE_TIMES_WEEKLY` / `WEEKLY` / `CUSTOM_DAYS` via `daysOfWeek.includes(isoDay)` with UTC date normalization.
- `DayOfWeekSelector.tsx` (`isHabitDueOnDay`, `deriveFrequencyType`, `getInitialDaysOfWeek`) aligns with `frequency.ts` when `daysOfWeek` is populated; passing the client's local `YYYY-MM-DD` to `GET /api/tracking/dashboard?date=...` prevents UTC vs. local day-boundary drift.

---

## 4. API Contract (`GET /api/tracking/dashboard` — Endpoint ID `API-S2-01` / Test ID `API-S2-02`)

### 4.1. Endpoint & RBAC Guard
* **Endpoint**: `GET /api/tracking/dashboard` (registered in `server/src/routes/tracking.routes.ts`)
* **Access**: Authenticated `PARTICIPANT` (`requireAuth`, `requireRole([Role.PARTICIPANT], 'PARTICIPANT_ROLE_REQUIRED')`)
* **Auth Errors**:
  * `401 UNAUTHORIZED` — missing or invalid JWT cookie/Bearer token
  * `403 PARTICIPANT_ROLE_REQUIRED` — authenticated as `PROGRAM_MANAGER`

### 4.2. Query Parameters & Validation
* **`date`** (optional `string`): `YYYY-MM-DD`. Defaults to current UTC date if omitted.
* **Invalid Date (`422 Unprocessable Entity`)**: If provided and invalid format (`/^\d{4}-\d{2}-\d{2}$/`) or non-existent calendar date (e.g., `2026-02-31`, checked via parsed UTC year/month/day round-trip), returns `AppError(422, 'INVALID_DATE_FORMAT', 'Date must be formatted as YYYY-MM-DD.')`:
  ```json
  {
    "error": {
      "code": "INVALID_DATE_FORMAT",
      "message": "Date must be formatted as YYYY-MM-DD.",
      "correlationId": "hl-req-..."
    }
  }
  ```

### 4.3. Response `200 OK` DTO (`API-SPEC-HL-02` Sec. 3.1)
```json
{
  "date": "2026-11-26",
  "weekStart": "2026-11-23",
  "weekEnd": "2026-11-29",
  "weekDays": [
    { "date": "2026-11-23", "dayLabel": "Mon", "dayNumber": 23, "isToday": false },
    { "date": "2026-11-24", "dayLabel": "Tue", "dayNumber": 24, "isToday": false },
    { "date": "2026-11-25", "dayLabel": "Wed", "dayNumber": 25, "isToday": false },
    { "date": "2026-11-26", "dayLabel": "Thu", "dayNumber": 26, "isToday": true },
    { "date": "2026-11-27", "dayLabel": "Fri", "dayNumber": 27, "isToday": false },
    { "date": "2026-11-28", "dayLabel": "Sat", "dayNumber": 28, "isToday": false },
    { "date": "2026-11-29", "dayLabel": "Sun", "dayNumber": 29, "isToday": false }
  ],
  "todayFocus": {
    "totalScheduled": 4,
    "completedCount": 2,
    "items": [
      {
        "habitId": 101,
        "title": "Journal",
        "category": "Mindfulness",
        "colorHex": "#ff9800",
        "frequency": "DAILY",
        "isCompleted": true
      }
    ]
  },
  "weeklyProgress": [
    {
      "habitId": 101,
      "title": "Journal",
      "category": "Mindfulness",
      "colorHex": "#ff9800",
      "frequency": "DAILY",
      "completedDaysThisWeek": 3,
      "scheduledDaysThisWeek": 7,
      "percentage": 43
    }
  ],
  "programCompletion": {
    "activeProgramsCount": 1,
    "totalCompletedLogs": 18,
    "totalScheduledDaysToDate": 25,
    "percentage": 72
  }
}
```
*Note: `category` in `todayFocus.items[]` and `weeklyProgress[]` is `string | null` (`null` for uncategorized habits).*

### 4.4. Client Service & Types (`client/`)
* **`client/src/types/habit.ts`**: Add `DashboardWeekDay`, `DashboardFocusItem`, `DashboardWeeklyProgressItem`, `DashboardProgramCompletion`, and `ParticipantDashboardResponse`.
* **`client/src/services/habits.service.ts`**: Add `fetchParticipantDashboard(date?: string): Promise<ParticipantDashboardResponse>` calling `GET /api/tracking/dashboard` (passing `?date=YYYY-MM-DD` when supplied) via `handleResponse`.

---

## 5. UI Specification & Component States (`UI-S2-03` & `Header.tsx`)

### 5.1. Visual Design Tokens (`client/src/styles/theme.css`)
Feature 6 uses the Warm Natural Shell tokens (`UI-SPEC-HL-02` Sec. 1):
* `--walnut: #724319` (section titles, active nav links, today highlight border/pill, Program Completion fill)
* `--light-coral: #d88180` (retry/secondary button borders)
* `--powder-blush: #f7b1b0` (page background canvas)
* `--papaya-whip: #feeac7` (card dividers, progress tracks, category pills)
* `--golden-sand: #cad182` (completion highlights, status pills)
* **Semantic Tokens**: `--color-surface: #ffffff`, `--color-text-main: #2d1c0b`, `--color-text-muted: #6b5e51`, `--color-error: #b3261e`, `--color-error-bg: #fdf2f2`.

### 5.2. `Header.tsx` Navigation Updates (`UI-SPEC-HL-02` Sec. 2)
* **Participant Navigation (`user.role === 'PARTICIPANT'`)**:
  * Remove `onClick={triggerUnderConstruction}` from the Participant `Dashboard` `<Link>` in both desktop nav and mobile drawer so clicking `Dashboard` navigates directly to `/dashboard` with no toast.
  * Render all 4 Participant links in desktop and mobile menus:
    1. `Habit Calendar` (`/calendar`)
    2. `Dashboard` (`/dashboard`)
    3. `Habits` (`/habits`)
    4. `Challenges` (`/challenges`)
  * Highlight the active route (`location.pathname`) in `var(--walnut)` (`fontWeight: 600`).
* **Program Manager Continuity**: Preserve existing Program Manager navigation (`Programs` `/manager` and Manager `Dashboard` under-construction toast) untouched until Feature 9.

### 5.3. `DashboardPage.tsx` Layout (`UI-S2-03`)
* **Program Manager Fallback & Route Guard Continuity**: `client/src/App.tsx` keeps `/dashboard` `allowedRoles={['PARTICIPANT', 'PROGRAM_MANAGER']}` and `* -> /calendar` unchanged until Features 7–9. When `user?.role === 'PROGRAM_MANAGER'` accesses `/dashboard`, `DashboardPage.tsx` renders the non-API Manager fallback placeholder card linking back to `/manager` without calling `GET /api/tracking/dashboard` (which rejects Managers with `403 PARTICIPANT_ROLE_REQUIRED`).
* For `PARTICIPANT`, render three cards inside `<main>`:

1. **Section 1 — Today's Focus Snippet (`FR-S2-04`)**:
   - **Mon–Sun Week Strip**: 7 cells (`Mon`..`Sun`) showing `dayLabel` and `dayNumber`. Today's column (`isToday === true`) sets `aria-current="date"` and Walnut/Papaya Whip highlight styling.
   - **Tally & Interactive Habit Rows**: Shows `"<completedCount> / <totalScheduled> completed"`. Each item in `todayFocus.items[]` displays:
     - Completion toggle checkbox (`aria-label` naming the habit) calling `toggleHabitCompletion(item.habitId, data.date, !item.isCompleted)`.
     - Sprint 1 palette color dot (`backgroundColor: item.colorHex`).
     - Habit title and category pill (`item.category || 'Uncategorized'`).
2. **Section 2 — Weekly Habit Progress Bars (`FR-S2-05`)**:
   - Header `"Weekly Habit Progress"` with `"<weekStart> to <weekEnd>"`.
   - Each item in `weeklyProgress[]` renders habit title, category pill (`item.category || 'Uncategorized'`), numeric ratio (`"${item.completedDaysThisWeek} / ${item.scheduledDaysThisWeek}"`), percentage (`"${item.percentage}%"`), and an accessible progress bar (`role="progressbar"`, `aria-valuenow={item.completedDaysThisWeek}`, `aria-valuemin={0}`, `aria-valuemax={item.scheduledDaysThisWeek}`) filled in `item.colorHex` at `width: "${item.percentage}%"`.
3. **Section 3 — Program Completion Bar (`FR-S2-06`)**:
   - Card titled `"Active Program Completion"` showing `activeProgramsCount`, `"<totalCompletedLogs> / <totalScheduledDaysToDate>"`, `"<percentage>%"`, and a Walnut/Golden Sand progress bar (`role="progressbar"`, `aria-valuenow={percentage}`, `aria-valuemin={0}`, `aria-valuemax={100}`).

### 5.4. Component UI State Matrix

| State | Visual & Interactive Behavior |
| :--- | :--- |
| **Initial Loading** | Renders accessible loading status (`role="status"`, `"Loading your dashboard..."`) while `fetchParticipantDashboard` runs; never renders the Sprint 1 `"under construction"` toast for Participants. |
| **Populated** | Displays Mon–Sun strip (`aria-current="date"`), Today's Focus interactive checkboxes + tally, Weekly Habit Progress Bars in each habit's `colorHex`, and Program Completion Bar. |
| **Toggle Optimistic & Refresh** | Toggling a focus habit optimistically updates `todayFocus` (`isCompleted`, `completedCount`) and `weeklyProgress` (`completedDaysThisWeek`, `percentage`), calls `POST /api/tracking/log`, then silently re-fetches `GET /api/tracking/dashboard` so `programCompletion` updates accurately without changing the `API-S2-01` DTO (`todayFocus.items[]` stays free of `programId`). |
| **Toggle Error** | Reverts optimistic toggle state and shows inline `role="alert"` error banner without clearing loaded dashboard data. |
| **Zero Habits / Empty Today** | Empty `todayFocus.items` shows `"No habits scheduled for today"` with a link to `/calendar`; empty `weeklyProgress` prompts creating habits on `/calendar`. |
| **Zero Active Challenges** | `activeProgramsCount === 0` displays `0%` (`0 / 0`) cleanly with a non-error note (`"No active challenge programs joined yet"`). |
| **API Fetch Error** | Displays `role="alert"` error panel with a **Retry** button that re-calls `fetchParticipantDashboard`. |

---

## 6. Software Test Specification

### 6.1. Sprint 1 Test Update (`docs/sprint-02/tests.md` Sec. 1)
1. **`UI-08` ([`client/tests/sprint-01/DashboardPlaceholder.test.tsx`](../../../client/tests/sprint-01/DashboardPlaceholder.test.tsx))**:
   - Update `UI-08` to test **only** the `PROGRAM_MANAGER` fallback card (and link to `/manager`, confirming `fetchParticipantDashboard` is not invoked), since Participant access to `/dashboard` now renders the live Participant Dashboard tested in `UI-S2-03` (`client/tests/sprint-02/ParticipantDashboard.test.tsx`).
   - All other existing Sprint 1 and Feature 5 unit/API/UI tests (`UT-01..UT-04`, `API-01..API-11`, `UI-01..UI-07`, `API-S2-01`, `UI-S2-01`, `UI-S2-02`) remain unchanged and passing.

### 6.2. New Feature-6 Tests (`docs/sprint-02/tests.md` Sec. 2)

| Test ID | Tier | File Path | Key Assertions & Status Codes |
| :--- | :--- | :--- | :--- |
| **UT-S2-03** | Server Unit | `server/tests/sprint-02/dashboard-calc.test.ts` | - Computes Mon–Sun `weekStart`/`weekEnd`/`weekDays` across mid-week, Monday, Sunday, and month/year transitions.<br>- Evaluates `scheduledDaysThisWeek` & `completedDaysThisWeek` for `DAILY` (`7`), `WEEKDAYS` (`5`), `THREE_TIMES_WEEKLY` (`daysOfWeek.length`), `CUSTOM_DAYS`, `WEEKLY` (`1`), and mid-week `startDate`/`endDate` bounds.<br>- Computes `programCompletion` (`activeProgramsCount`, `totalCompletedLogs`, `totalScheduledDaysToDate`, `percentage`) bounded by `[startDate, min(today, endDate)]` with `0` denominator -> `percentage: 0`. |
| **API-S2-02** *(Test ID; covers Endpoint ID `API-S2-01`)* | Server API | `server/tests/sprint-02/dashboard.api.test.ts` | - `GET /api/tracking/dashboard?date=YYYY-MM-DD` returns `200 OK` with 7 `weekDays` (`isToday` on anchor), `todayFocus`, `weeklyProgress` (preserving `category` & Sprint 1 `colorHex`), and `programCompletion` (after joining a challenge and logging completions).<br>- Excludes archived (`isActive: false`) habits.<br>- Rejects malformed/invalid `date` (`bad-date`, `2026-02-31`) with `422 INVALID_DATE_FORMAT`.<br>- Returns `401` unauthenticated and `403 PARTICIPANT_ROLE_REQUIRED` for `PROGRAM_MANAGER`. |
| **UI-S2-03** | Client UI | `client/tests/sprint-02/ParticipantDashboard.test.tsx` | - Renders Mon–Sun 7-day strip with `aria-current="date"` on today, Today's Focus Snippet (color dot, category pill + `"Uncategorized"` fallback, toggle), Weekly Habit Progress Bars shaded in each habit's `colorHex`, and Program Completion Bar.<br>- Toggling a focus habit optimistically updates `todayFocus` + `weeklyProgress`, calls `toggleHabitCompletion`, and silently re-fetches `fetchParticipantDashboard` to sync `programCompletion`; rollback + `role="alert"` on failure.<br>- Verifies zero-habit empty state, zero-challenge `0%` state, API fetch retry flow, and `Header.tsx` Participant nav (`Habit Calendar`, `Dashboard`, `Habits`, `Challenges`) without the under-construction toast. |

### 6.3. Responsive & Viewport Verifications
* **Desktop (`>= 992px`)**: `Header.tsx` renders all 4 Participant links horizontally; Mon–Sun week strip renders all 7 days in one row; Today's Focus, Weekly Progress Bars, and Program Completion Bar display cleanly without horizontal scroll.
* **Tablet (`768px – 991px`)**: Dashboard cards stack/reflow cleanly without overflow; toggle checkboxes and Retry buttons maintain `>= 44px` touch targets.
* **Mobile (`< 768px`)**: `Header.tsx` collapses nav into mobile hamburger drawer displaying all 4 Participant links (`Habit Calendar`, `Dashboard`, `Habits`, `Challenges`); Mon–Sun week strip fits or scrolls cleanly inside viewport width; dashboard sections stack vertically at `100%` width without clipping.
