# Feature 5 Engineering Contract: Habit Customization & Quick-View Card

**Feature ID**: FEATURE-HL-05  
**Target Branch**: `feature/5-habit-customization-quickview`  
**Base Branch**: `app/sprint-02` (or `staging-2`)  
**Status**: Approved for Implementation  
**Version**: 1.3  
**Sprint Alignment**: Sprint 2 (Increment 1 of 5)  
**Parent Specifications**:
- [`docs/sprint-02/specification.md`](../../sprint-02/specification.md) (`SPEC-HL-02`, v1.0)
- [`docs/sprint-02/api-spec.md`](../../sprint-02/api-spec.md) (`API-SPEC-HL-02`, v1.0)
- [`docs/sprint-02/ui-spec.md`](../../sprint-02/ui-spec.md) (`UI-SPEC-HL-02`, v1.0)
- [`docs/sprint-02/tests.md`](../../sprint-02/tests.md) (`TEST-HL-02`, v1.0)
- [`docs/sprint-02/habitless_sprint2_draft.pdf`](../../sprint-02/habitless_sprint2_draft.pdf) (pp. 1–4)

---

## 1. Purpose, Scope, and Explicit Exclusions

### 1.1. Purpose & Deliverables
Feature 5 establishes the personal habit customization and non-destructive inspection foundation for Sprint 2 on the participant calendar (`/calendar`), building directly on the completed Sprint 1 baseline (`feature/1-auth-roles` through `feature/4-program-challenge`).

It delivers exactly two Sprint 2 capabilities while preserving Sprint 1's fixed 8-color habit palette (`FR-05`, `BR-02`):
1. **Habit & Challenge Category Selection (`FR-S2-02`, `BR-S2-02`)**:
   - Adds a nullable `category` column (`VarChar(50)`) to the `Habit` model (`null` by default for existing Sprint 1 habits, displayed as `"Uncategorized"`).
   - Updates category selection in `NewHabitModal.tsx`, `EditHabitModal.tsx`, and the Program Manager challenge creator (`ProgramBuilder.tsx`) to use the 9 Sprint 2 preset options (`Health & Fitness`, `Sleep & Recovery`, `Mindfulness`, `Productivity`, `Learning`, `Finance`, `Social`, `Home`, `Hobbies`) plus a `Custom...` option revealing a free-text input (max 50 characters).
   - On `ProgramBuilder.tsx`, challenge `category` remains required (`1–50` chars per `program-validator.ts`), defaults to `"Health & Fitness"`, and editing a draft with a legacy/non-preset category (such as `"Wellness"`) selects `Custom...` and pre-fills the custom input.
2. **Habit Quick-View Card (`FR-S2-03`, `BR-S2-03`)**:
   - Clicking a habit row/title on `CalendarMatrix.tsx` (`/calendar`) opens a read-only `HabitQuickViewModal.tsx` displaying full habit details: title, description (or `"No description provided"`), category pill (`"Uncategorized"` if `null`), frequency summary + active day chips, start/end dates (or `"Ongoing"`), and assigned Sprint 1 palette color swatch.
   - Provides three action buttons: **Back** (closes card without entering edit mode), **Edit** (closes Quick-View and opens `EditHabitModal.tsx`), and **Delete** (confirms and soft-archives via `DELETE /api/habits/:id`, setting `isActive: false` while preserving historical `HabitLog` and `DailyNote` records).

### 1.2. Explicit Exclusions (Strict Scope Boundary)
All capabilities outside Feature 5 are strictly excluded from `feature/5-habit-customization-quickview`:

* **Deferred Custom Habit Colors & Preserved Sprint 1 Palette (`FR-05`, `BR-02`)**:
  - **Customizable Habit Colors** (custom arbitrary hex input, 9th custom color circle, color wheel, Choice 9 keyboard rules, and adaptive luminance contrast) are deferred beyond Sprint 2 alongside the deferred items from `habitless_sprint1_draft.pdf` Sec. 3.2.
  - `server/src/utils/palette-validator.ts` strictly enforces the Sprint 1 fixed 8-color palette allowlist and rejects non-palette hexes with HTTP `422 INVALID_HABIT_COLOR`; `client/src/components/ColorPicker.tsx` remains unchanged from Sprint 1 (8 fixed circular swatches only).
* **Excluded Feature 6 (`feature/6-participant-dashboard`)**:
  - Live Participant Dashboard (`/dashboard`) with Mon–Sun week strip, Today's Focus Snippet, Weekly Habit Progress Bars, Program Completion Bar, `GET /api/tracking/dashboard`, and removal of the Sprint 1 Dashboard under-construction placeholder/toast (`UI-08`).
* **Excluded Feature 7 (`feature/7-habit-stats-heatmap`)**:
  - All Habits Directory (`/habits`), Individual Habit Statistics page (`/habits/:id/stats`), `GET /api/habits/:id/stats`, Month/Year completion heatmaps (which shade cells using the habit's assigned Sprint 1 palette `colorHex`), and Current/Highest Streak counters.
* **Excluded Feature 8 (`feature/8-challenges-hub-sync`)**:
  - Interactive Challenges Hub (`/challenges`), `GET /api/challenges`, challenge search/filtering, enrollment status transitions (`ACTIVE` / `LEFT` / `COMPLETED`), `Habit.sourceActivityId` / `challengeStatus` / `syncedVersion` columns, `ChallengeProgram.version` / `hasTemplateEditsSincePublish`, `"Challenge"` / `"Challenge (Ended)"` badges, Leave Keep/Remove prompt, `"Update Available"` / `"Sync Changes"` (`POST /api/challenges/:id/sync`), and participant challenge ratings & comments (`ChallengeRating`, `ChallengeComment`).
* **Excluded Feature 9 (`feature/9-manager-analytics-directory`)**:
  - Program Manager Analytics Dashboard (`/manager/dashboard`), Global Challenges Directory (`/manager/challenges`), strictly read-only Challenge Detail View page (`/manager/challenges/:id`), and Program Manager 1-level comment replies. *(Cross-feature rule for Feature 9 statistics: any non-preset `ChallengeProgram.category` created via `ProgramBuilder.tsx`'s `Custom...` option is aggregated/displayed under `"Other"` in Top Categories statistics until inspected further.)*
* **Excluded Sprint 1 Deferred Items & Drift Policy (`SPEC-HL-02` Sec. 2.1, 2.3)**:
  - No changes to `AuthForm.tsx`, `/api/auth/*`, `/api/health`, `/api/ready`, `DailyNote` CRUD (`/api/tracking/notes`), or `Dockerfile` / `client/Dockerfile` / `server/Dockerfile`.
  - Sprint 2 UI selectors (`DayOfWeekSelector`) restrict new/edited habits to Daily, Certain Days, and Weekly only (`BR-S2-04`), while `VALID_FREQUENCIES` in `server/src/controllers/habits.controller.ts` retains `MONTHLY` untouched for Sprint 1 backward compatibility.
  - Customizable habit colors, bug report form, daily mood tracker, email/SMS reminders, CSV export, public popularity rankings, and manager roster removal remain excluded.

---

## 2. Requirements & Acceptance Criteria Traceability

| ID | Category | Description | Feature-5 Implementation Target |
| :--- | :--- | :--- | :--- |
| **FR-S2-02** | Functional | Habit & Challenge Category Selection | `Habit.category` (`VarChar(50)` nullable), `habits.controller.ts`, `NewHabitModal.tsx`, `EditHabitModal.tsx`, and `ProgramBuilder.tsx` (9 presets + `Custom...` input; `ChallengeProgram.category` already stored as `String` and validated `1–50` chars in `program-validator.ts`). |
| **FR-S2-03** | Functional | Habit Quick-View Card | `HabitQuickViewModal.tsx`, `CalendarMatrix.tsx` row/title click trigger, `HabitCalendarPage.tsx` state orchestration (`Back`, `Edit`, `Delete` -> `archiveHabit`). |
| **BR-S2-02** | Business Rule | Habit & Challenge Category Constraints | **Habits**: Optional nullable `String? @db.VarChar(50)`; trimmed; empty string -> `null` (`"Uncategorized"`); > 50 chars -> HTTP `422` (`INVALID_HABIT_CATEGORY`).<br>**Challenges**: Required `String` (`1–50` chars trimmed per `program-validator.ts`); accepts the 9 presets or any custom label. Any non-preset challenge category is grouped as `"Other"` in Feature 9 summary statistics until inspected further. |
| **BR-S2-03** | Business Rule | Quick-View Delete Soft-Archive Invariant | Quick-View **Delete** invokes `DELETE /api/habits/:id`, setting `isActive: false` while preserving `HabitLog` and `DailyNote` records. |
| **FR-05 / BR-02** *(Preserved)* | Sprint 1 Baseline | Fixed 8-Color Habit Palette | `server/src/utils/palette-validator.ts` (`ALLOWED_HABIT_COLORS`) and `client/src/components/ColorPicker.tsx` (8 fixed circular swatches) remain unchanged from Sprint 1; non-palette hexes return HTTP `422` (`INVALID_HABIT_COLOR`). |
| **AC-S2-02** | Acceptance | Habit & Challenge Category Selection | Participant (on `NewHabitModal` / `EditHabitModal`) or Program Manager (on `ProgramBuilder`) picks one of the 9 presets or `Custom` label -> persisted in `Habit.category` / `ChallengeProgram.category`; Sprint 1 habits with `category: null` display `"Uncategorized"`, and non-preset draft challenge categories pre-populate `Custom...` when edited. |
| **AC-S2-03** | Acceptance | Quick-View Card Actions | Clicking habit row/title on `/calendar` opens read-only Quick-View Card; **Back** closes card; **Edit** transitions to `EditHabitModal`; **Delete** confirms and soft-archives habit (`isActive: false`), removing it from active calendar without deleting logs. |

---

## 3. Data Design & Migration Requirements

### 3.1. Prisma Schema Changes (`server/prisma/schema.prisma`)
Feature 5 adds **only** the `category` field to `model Habit`. No other tables, enums, or Feature 8 challenge columns (`sourceActivityId`, `challengeStatus`, `syncedVersion`, `version`, etc.) are modified in Feature 5.

```prisma
model Habit {
  id          Int               @id @default(autoincrement())
  userId      Int
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?
  category    String?           @db.VarChar(50)
  colorHex    String            @default("#448aff")
  frequency   FrequencyType     @default(DAILY)
  daysOfWeek  Int[]             @default([1, 2, 3, 4, 5, 6, 7]) // ISO-8601: 1=Mon .. 7=Sun
  startDate   DateTime          @default(now())
  endDate     DateTime?
  targetCount Int               @default(20)
  isActive    Boolean           @default(true)
  programId   Int?              // Link to challenge program
  program     ChallengeProgram? @relation(fields: [programId], references: [id], onDelete: SetNull)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  logs        HabitLog[]
  notes       DailyNote[]

  @@index([userId, isActive])
  @@index([programId])
  @@map("habits")
}
```

### 3.2. Additive Migration & Backward-Compatibility Invariants
* **Migration**: Additive `ALTER TABLE "habits" ADD COLUMN "category" VARCHAR(50);` generated via Prisma Migrate.
* **Existing Sprint 1 Habits**: All pre-existing `habits` rows (including the 8 seeded habits in `server/prisma/seed.ts`) automatically receive `category = NULL`. UI components render `null` as `"Uncategorized"`.
* **Soft-Archive Data Preservation (`BR-S2-03`)**: `DELETE /api/habits/:id` executes `prisma.habit.update({ where: { id }, data: { isActive: false } })`. Linked `HabitLog` rows (cascade only on hard delete) and `DailyNote` rows (`onDelete: SetNull` on hard delete) remain intact in PostgreSQL.

---

## 4. API Contract

All endpoints below require an authenticated `PARTICIPANT` session (`requireAuth`, `requireRole([Role.PARTICIPANT], 'PARTICIPANT_ROLE_REQUIRED')`). Unauthenticated requests return `401 UNAUTHORIZED`; `PROGRAM_MANAGER` tokens return `403 PARTICIPANT_ROLE_REQUIRED`; missing or unowned habit IDs return `404 HABIT_NOT_FOUND`.

### 4.1. Standard Error Envelope
Error responses follow `server/src/middleware/errorHandler.ts`:
```json
{
  "error": {
    "code": "INVALID_HABIT_CATEGORY",
    "message": "Category cannot exceed 50 characters.",
    "correlationId": "hl-req-..."
  }
}
```

### 4.2. Habit Color & Category Validation Rules

| Field | Endpoint(s) | Validation Rules | Error Code & Status |
| :--- | :--- | :--- | :--- |
| `frequency` | `POST /api/habits` / `PUT /api/habits/:id` | Retains Sprint 1 `VALID_FREQUENCIES` (including `MONTHLY`) in `habits.controller.ts` for Sprint 1 backward compatibility, while Sprint 2 UI selectors expose Daily, Certain Days, and Weekly only (`BR-S2-04`). | `422` `INVALID_HABIT_FREQUENCY` |
| `colorHex` | `POST /api/habits` (required)<br>`PUT /api/habits/:id` (optional) | **Sprint 1 `FR-05` / `BR-02` preserved**: `server/src/utils/palette-validator.ts` strictly enforces the fixed 8-color palette allowlist (`#448aff`, `#1565c0`, `#009688`, `#8bc34a`, `#ffc107`, `#ff9800`, `#f44336`, `#ad1457`, or `#RRGGBBff` normalized to lowercase `#rrggbb`). Non-palette hexes (e.g., `#9c27b0`) and malformed values are rejected. | `422` `INVALID_HABIT_COLOR` |
| `category` | `POST /api/habits` (optional)<br>`PUT /api/habits/:id` (optional) | If `undefined` on `POST`, stored as `null`. If `null`, stored as `null`. Must be a `string` if provided (non-string non-null values rejected). Trimmed; empty trimmed string `""` normalizes to `null`. Trimmed length `> 50` rejected. Accepts any of the 9 presets or custom string `1..50` chars. | `422` `INVALID_HABIT_CATEGORY` |

### 4.3. `POST /api/habits` (Create Habit)
* **Request DTO**:
  ```json
  {
    "title": "Evening Reading",
    "description": "Read 20 pages of non-fiction",
    "category": "Learning",
    "colorHex": "#009688",
    "frequency": "DAILY",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "startDate": "2026-11-26T00:00:00.000Z",
    "endDate": null,
    "targetCount": 20
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "id": 109,
    "userId": 2,
    "title": "Evening Reading",
    "description": "Read 20 pages of non-fiction",
    "category": "Learning",
    "colorHex": "#009688",
    "frequency": "DAILY",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "startDate": "2026-11-26T00:00:00.000Z",
    "endDate": null,
    "targetCount": 20,
    "isActive": true,
    "programId": null,
    "createdAt": "2026-11-26T14:00:00.000Z",
    "updatedAt": "2026-11-26T14:00:00.000Z"
  }
  ```
* **Statuses**: `201 Created`, `401 Unauthorized`, `403 Forbidden`, `422 Unprocessable Entity` (`INVALID_HABIT_TITLE`, `INVALID_HABIT_DESCRIPTION`, `INVALID_HABIT_CATEGORY`, `INVALID_HABIT_COLOR`, `INVALID_HABIT_FREQUENCY`, `INVALID_DAYS_OF_WEEK`, `INVALID_START_DATE`, `INVALID_END_DATE`, `INVALID_DATE_RANGE`, `INVALID_TARGET_COUNT`).

### 4.4. `PUT /api/habits/:id` (Update Habit)
* **Request DTO**: Any subset of `title`, `description`, `category`, `colorHex`, `frequency`, `daysOfWeek`, `startDate`, `endDate`, `targetCount`.
  * Sending `"category": null` or `"category": ""` clears `category` back to `null`.
* **Response `200 OK`**: Updated Habit DTO (same structure as `POST /api/habits`, including `category` and Sprint 1 palette `colorHex`).
* **Statuses**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (`HABIT_NOT_FOUND`), `422 Unprocessable Entity` (`INVALID_HABIT_CATEGORY`, and existing Sprint 1 validation codes including `INVALID_HABIT_COLOR`).

### 4.5. `GET /api/habits` & `GET /api/habits/:id`
* Include `category` (`string | null`) on every returned Habit DTO (`200 OK`).

### 4.6. `DELETE /api/habits/:id` (Soft-Archive from Quick-View or Edit Modal)
* **Behavior**: Sets `isActive = false` on the owned habit (`BR-S2-03`).
* **Statuses**: `204 No Content` (empty body), `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (`HABIT_NOT_FOUND`).

### 4.7. `GET /api/tracking/calendar?month=M&year=YYYY`
* **Response `200 OK`**: Each element in `habits[]` adds `category` and `programId` (`number | null`) alongside existing fields (`habitId`, `title`, `description`, `colorHex`, `frequency`, `daysOfWeek`, `startDate`, `endDate`, `targetCount`, `goalAchievedCount`, `days`) so clicking a row populates `HabitQuickViewModal` without an extra API call. Challenge-sync fields (`programTitle`, `challengeStatus`, `syncedVersion`, `latestProgramVersion`, `updateAvailable`) remain deferred to Feature 8 (`feature/8-challenges-hub-sync`):
  ```json
  {
    "habitId": 109,
    "title": "Evening Reading",
    "description": "Read 20 pages of non-fiction",
    "category": "Learning",
    "colorHex": "#009688",
    "frequency": "DAILY",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "startDate": "2026-11-26T00:00:00.000Z",
    "endDate": null,
    "targetCount": 20,
    "goalAchievedCount": 5,
    "programId": null,
    "days": { "26": true }
  }
  ```

### 4.8. `GET /api/tracking/today?date=YYYY-MM-DD`
* **Response `200 OK`**: Each element in `items[]` adds `category` (`string | null`) and `programId` (`number | null`) alongside existing fields (`habitId`, `title`, `description`, `colorHex`, `frequency`, `isCompleted`, `logId`). Feature 8 challenge-sync fields remain deferred.

### 4.9. Manager Challenge Creator (`POST /api/manager/programs` & `PUT /api/manager/programs/:id`)
* **Category Compatibility**: `ChallengeProgram.category` is already a non-null `String` column in `schema.prisma`, and `server/src/utils/program-validator.ts` already accepts any trimmed string `1–50` characters (returning `422 VALIDATION_ERROR` with `fieldErrors: [{ field: "category", ... }]` if empty or `> 50` chars). No backend schema or validator change is needed for `ChallengeProgram.category` to persist either the 9 presets or custom category names.

---

## 5. UI Specification & Component States

### 5.1. Visual Design Tokens (`client/src/styles/theme.css`)
All Feature 5 components use the Warm Natural Shell tokens (`UI-SPEC-HL-02` Sec. 1):
* `--walnut: #724319` (modal headings, primary Save/Edit buttons, selected focus rings, active day cells)
* `--light-coral: #d88180` (secondary borders, Delete/Archive buttons, confirmation danger action)
* `--powder-blush: #f7b1b0` (page backdrop canvas)
* `--papaya-whip: #feeac7` (input borders, card dividers, category badge fills)
* `--golden-sand: #cad182` (goal achieved highlight pills)
* **Semantic Tokens**: `--color-surface: #ffffff`, `--color-text-main: #2d1c0b`, `--color-text-muted: #6b5e51`, `--color-error: #b3261e`, `--color-error-bg: #fdf2f2`.

### 5.2. `ColorPicker.tsx` (Preserved Sprint 1 8-Color Palette — `FR-05` / `BR-02`)
* `client/src/components/ColorPicker.tsx` remains **unchanged from Sprint 1**:
  * Renders `role="radiogroup"` (`aria-label="Habit color selection"`) containing Sprint 1's **8 fixed circular swatches** (`Blue Energy #448aff`, `Ocean Deep #1565c0`, `Verdigris #009688`, `Yellow Green #8bc34a`, `Amber Gold #ffc107`, `Amber Glow #ff9800`, `Cinnabar #f44336`, `Cherry Rose #ad1457`).
  * No 9th custom color circle, color wheel, `#RRGGBB` hex input, Choice 9 keyboard rules, or adaptive luminance contrast changes are added.

### 5.3. Category Selector (`NewHabitModal.tsx`, `EditHabitModal.tsx` & `ProgramBuilder.tsx`)
* **Shared 9 Preset Categories**:
  - `Health & Fitness`, `Sleep & Recovery`, `Mindfulness`, `Productivity`, `Learning`, `Finance`, `Social`, `Home`, `Hobbies`, plus `__CUSTOM__` (`Custom...`).
* **Habit Modals (`NewHabitModal.tsx` & `EditHabitModal.tsx`)**:
  * Dropdown (`<select aria-label="Category">`) starts with `""` (`Uncategorized (Optional)`), followed by the 9 presets and `__CUSTOM__` (`Custom...`).
  * Selecting `__CUSTOM__` reveals a text input (`aria-label="Custom category"`, `maxLength={50}`, character counter `X / 50`), trimmed before submit.
  * Validation: If `Custom...` is selected and the custom text is empty/whitespace when saving, display inline validation error (`"Please enter a custom category or select Uncategorized."`); if length > 50, display `"Category cannot exceed 50 characters."`.
  * **Pre-Populated Edit State (`EditHabitModal.tsx`)**: `null`/empty -> `""`; matches one of the 9 presets -> selects that preset; non-empty non-preset string -> selects `__CUSTOM__` and pre-fills the custom input.
* **Program Manager Challenge Creator (`ProgramBuilder.tsx`)**:
  * Replaces Sprint 1's hardcoded `CATEGORIES` (`Wellness`, `Fitness`, `Mindfulness`, `Nutrition`, `Productivity`, `Other`) with the 9 Sprint 2 presets plus `__CUSTOM__` (`Custom...`), defaulting new challenges to `"Health & Fitness"`.
  * Because `ChallengeProgram.category` is required (`1–50` chars), `ProgramBuilder.tsx` does **not** offer an `"Uncategorized"` option; selecting `__CUSTOM__` reveals a required custom category text input (`aria-label="Custom category"`, `maxLength={50}`, character counter `X / 50`) validated client-side (`"Custom category is required."` / `"Category cannot exceed 50 characters."`).
  * **Pre-Populated Draft Edit State (`ProgramBuilder.tsx`)**: If a draft's `category` matches one of the 9 presets -> selects that preset; if it is a legacy or non-preset string (e.g., `"Wellness"`) -> selects `__CUSTOM__` and pre-fills the custom category text input.

### 5.4. `HabitQuickViewModal.tsx` & `CalendarMatrix.tsx` Integration
* **Trigger (`CalendarMatrix.tsx`)**:
  * Clicking a habit row's title/label area in the sticky `HABITS` column opens `HabitQuickViewModal` for that habit (`aria-label` or button role on the habit title trigger for keyboard & screen-reader accessibility).
  * The existing inline `Edit` button on `CalendarMatrix` rows remains in place (calling `e.stopPropagation()` before `onEditHabit(h)`) so Sprint 1 tests (`UI-04`, `E2E-02`) stay green, while clicking the habit title/row opens `HabitQuickViewModal`.
* **Quick-View Card (`role="dialog"`, `aria-modal="true"`)**:
  * Strictly **read-only** fields:
    1. Color swatch circle (`habit.colorHex`) + Habit Title
    2. Category pill (`habit.category || 'Uncategorized'`)
    3. Description (`habit.description || 'No description provided'`)
    4. Frequency label (`getFrequencyLabel(daysOfWeek)`) + Mon–Sun day chips showing scheduled days
    5. Date schedule: `Start Date` (`YYYY-MM-DD`) and `End Date` (`YYYY-MM-DD` or `'Ongoing'`)
    6. Target count (`Target: X days`)
  * **Three Action Buttons**:
    1. **Back**: Closes Quick-View card and restores focus to the triggering element.
    2. **Edit**: Closes Quick-View card and opens `EditHabitModal` pre-populated with that habit's full fields (including `category` and assigned Sprint 1 palette `colorHex`).
    3. **Delete**: Displays a themed in-modal confirmation prompt inside `HabitQuickViewModal.tsx` (`"Are you sure you want to remove \"<title>\" from your active habits? Your historical completion logs will be preserved."` with **Confirm Delete** and **Cancel** buttons, rather than `window.confirm`). Confirming executes `DELETE /api/habits/:id` (`archiveHabit`), disables buttons while deleting (`"Deleting..."`), closes the modal, and refreshes the calendar matrix and habits list.

### 5.5. Component UI State Matrix

| Component / Flow | State | Visual & Interactive Behavior |
| :--- | :--- | :--- |
| **`NewHabitModal`** | Initial | `colorHex` defaults to `#ff9800` (Amber Glow preset in Sprint 1 8-swatch `ColorPicker`), `category` defaults to `""` (Uncategorized). |
| **`EditHabitModal`** | Pre-Populated | Loads `title`, `description`, `category` (preset or `Custom...` + text), `colorHex` (Sprint 1 preset swatch), `daysOfWeek`, `startDate`, `endDate`, `targetCount`. |
| **`ProgramBuilder`** | Create / Edit Draft | New programs default `category` to `"Health & Fitness"`; `Custom...` reveals required `1–50` char input; editing a non-preset draft (e.g., `"Wellness"`) selects `Custom...` and pre-fills the value. |
| **`NewHabitModal` / `EditHabitModal`** | Submitting / API 422 | Primary submit button disabled (`"Saving..."`); API `INVALID_HABIT_CATEGORY` (or Sprint 1 `INVALID_HABIT_COLOR`) renders in alert banner or field error. |
| **`HabitQuickViewModal`** | Read-Only View | Displays all habit attributes; `Escape` or backdrop click or **Back** closes card; **Edit** switches cleanly to `EditHabitModal`. |
| **`HabitQuickViewModal`** | Delete Confirmation | Clicking **Delete** toggles confirmation state inside the modal; **Cancel** returns to read-only view; **Confirm Delete** calls `DELETE /api/habits/:id`. |
| **`HabitQuickViewModal`** | Delete Loading / Error | During request: buttons disabled, shows `"Deleting..."`. On API failure: stays open, renders error alert (`role="alert"`) allowing retry or cancel. |

---

## 6. Software Test Specification

### 6.1. Required Updates to Existing Sprint 1 Tests (`docs/sprint-02/tests.md` Sec. 1)

Sprint 1 color-palette tests (`UT-01`, `API-06`, `UI-02`, and `UI-05`) remain **unchanged** and continue passing as-is under Sprint 1 `FR-05` / `BR-02`. Only the following Sprint 1 tests require updates for Sprint 2 category presets:

1. **`UI-07` ([`client/tests/sprint-01/ProgramBuilder.test.tsx`](../../../client/tests/sprint-01/ProgramBuilder.test.tsx)) & `E2E-03` ([`e2e/sprint-01/manager-journey.spec.ts`](../../../e2e/sprint-01/manager-journey.spec.ts))**:
   - Update `ProgramBuilder.test.tsx` line 157 expected default category from `'Wellness'` to `'Health & Fitness'`.
   - Update `e2e/sprint-01/manager-journey.spec.ts` line 31 `.selectOption('Wellness')` to `.selectOption('Health & Fitness')` (or test selecting one of the 9 Sprint 2 presets).

### 6.2. New Feature-5 Tests (`docs/sprint-02/tests.md` Sec. 2)

| Test ID | Tier | File Path | Key Assertions & Status Codes |
| :--- | :--- | :--- | :--- |
| **API-S2-01** | Server API | `server/tests/sprint-02/habits-s2.api.test.ts` | - `POST /api/habits` with Sprint 1 palette hex `#448aff` and preset category `"Health & Fitness"` -> `201`, `colorHex === '#448aff'`, `category === 'Health & Fitness'`.<br>- `POST /api/habits` with custom category `"Morning Routine"` -> `201`.<br>- `POST /api/habits` omitting `category` or sending `""` -> `201`, `category === null`.<br>- `POST /api/habits` with `category` > 50 chars -> `422 INVALID_HABIT_CATEGORY`.<br>- `POST /api/habits` with non-palette hex `"#9c27b0"` -> `422 INVALID_HABIT_COLOR` (Sprint 1 `BR-02` preserved).<br>- `PUT /api/habits/:id` updates `category` (including clearing to `null`) and valid palette `colorHex` -> `200`; `GET /api/tracking/calendar` and `GET /api/tracking/today` include `category` and `programId`.<br>- Cross-user `PUT`/`DELETE` returns `404 HABIT_NOT_FOUND`; Manager returns `403 PARTICIPANT_ROLE_REQUIRED`. |
| **UI-S2-01** | Client UI | `client/tests/sprint-02/HabitQuickViewModal.test.tsx` | - Clicking a habit title/row on `CalendarMatrix` opens `HabitQuickViewModal` showing title, description, category (`"Uncategorized"` when `null`), frequency, dates, and color.<br>- Clicking **Back** closes Quick-View without calling `updateHabit` or `archiveHabit`.<br>- Clicking **Edit** closes Quick-View and opens `EditHabitModal` pre-populated with habit values.<br>- Clicking **Delete** shows confirmation prompt; confirming calls `archiveHabit(id)` (`DELETE /api/habits/:id`), closes modal, and triggers calendar refresh; API error displays inline alert. |
| **UI-S2-02** | Client UI | `client/tests/sprint-02/HabitCustomization.test.tsx` | - Renders all 9 category presets (`Health & Fitness`, `Sleep & Recovery`, `Mindfulness`, `Productivity`, `Learning`, `Finance`, `Social`, `Home`, `Hobbies`) + `Uncategorized` + `Custom...` in `NewHabitModal` and `EditHabitModal`, and renders the 9 presets + `Custom...` in `ProgramBuilder`.<br>- Selecting `Custom...` reveals text input (max 50 chars); submitting blank custom category shows inline validation error in habit modals and `ProgramBuilder`.<br>- Editing a habit or draft challenge program with an existing non-preset category selects `Custom...` and pre-fills its value.<br>- Preserves Sprint 1's 8 fixed palette swatches in `ColorPicker` (no 9th custom circle or color wheel). |

### 6.3. Responsive & Viewport Verifications
* **Desktop (`>= 992px`)**: Quick-View Card and New/Edit modals center at `max-width: 520px`; `ColorPicker` 8 swatches fit cleanly in a single wrapped row without horizontal overflow.
* **Tablet (`768px – 991px`)**: Sticky `HABITS` column habit title click target remains accessible during horizontal grid scroll; modal buttons and color swatches maintain `>= 44px` touch targets.
* **Mobile (`< 768px`)**: Modals (`HabitQuickViewModal`, `NewHabitModal`, `EditHabitModal`) expand up to `95%` viewport width with `max-height: 90vh` vertical scrolling; `ColorPicker` 8 swatches wrap cleanly without clipping; `HabitQuickViewModal` action buttons (`Back`, `Edit`, `Delete`) remain clickable with `>= 44px` height.
