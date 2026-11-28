# HabitLess Sprint 2 UI Design Specification

**Document ID**: UI-SPEC-HL-02  
**Version**: 1.0  
**Status**: Approved Design Baseline (Sprint 2)  
**Parent Project**: HabitLess - Habit and Activity Tracking System  
**Baseline Reference**: [`docs/sprint-01/ui-spec.md`](../sprint-01/ui-spec.md) (`UI-SPEC-HL-01`, v1.5)  
**Source Briefs**:
- [`docs/sprint-02/habitless_sprint2_draft.pdf`](habitless_sprint2_draft.pdf) (pp. 1–4)
- [`docs/sprint-01/habitless_sprint1_draft.pdf`](../sprint-01/habitless_sprint1_draft.pdf) (pp. 1–3)

---

## 1. Visual Design Tokens & Continuity

All Sprint 2 UI views preserve the Sprint 1 Warm Natural Shell tokens defined in [`client/src/styles/theme.css`](../../client/src/styles/theme.css) and [`docs/sprint-01/habitless_sprint1_draft.pdf`](../sprint-01/habitless_sprint1_draft.pdf) (Sec. 2.1):

* **Website Theme Tokens**:
  * `--walnut: #724319` (Headers, active nav, primary buttons, headings)
  * `--light-coral: #d88180` (Secondary/destructive actions, ended/warning accents)
  * `--powder-blush: #f7b1b0` (Main app background canvas)
  * `--papaya-whip: #feeac7` (Card borders, table headers, subtle surface tint)
  * `--golden-sand: #cad182` (Success/active badges, completion accents)
  * Semantic tokens (`--color-surface: #ffffff`, `--color-text-main: #2d1c0b`, `--color-text-muted: #6b5e51`, `--color-error: #b3261e`, `--color-error-bg: #fdf2f2`).
* **Habit Color Palette (`FR-05`, `BR-02` — Unchanged from Sprint 1)**:
  * Sprint 1's fixed 8 swatches (`#448aff`, `#1565c0`, `#009688`, `#8bc34a`, `#ffc107`, `#ff9800`, `#f44336`, `#ad1457`) remain unchanged in `ColorPicker.tsx`. Customizable habit colors (9th circle, color wheel, and custom hex input) are deferred out of Sprint 2.

---

## 2. Navigation Shell Updates (`Header.tsx`)

Remove the Sprint 1 `"Dashboard is still under construction"` click toast (`DashboardPlaceholder`).

* **Participant Navigation Links**:
  * `Habit Calendar` (`/calendar`)
  * `Dashboard` (`/dashboard`)
  * `Habits` (`/habits`)
  * `Challenges` (`/challenges`)
* **Program Manager Navigation Links**:
  * `Programs` (`/manager`) — manager's own Challenge Builder & management table
  * `Dashboard` (`/manager/dashboard`) — analytics panel
  * `Directory` (`/manager/challenges`) — Global Challenges Directory

---

## 3. Participant Screens & Components (`UI-S2-*`)

### `UI-S2-01`: Habit Quick-View Card (`HabitQuickViewModal.tsx`)
* **Trigger**: Clicking the habit title/row in [`client/src/components/CalendarMatrix.tsx`](../../client/src/components/CalendarMatrix.tsx) (`/calendar`).
* **Content (Strictly Read-Only)**:
  * Color indicator swatch + Habit Title
  * Category pill (displays `"Uncategorized"` if `category === null`)
  * Description (or `"No description provided"`)
  * Frequency summary label (e.g., `"Daily"`, `"3x per week"`, `"Weekly"`) + active day chips
  * Start Date & End Date (or `"Ongoing"`)
  * Challenge status badge if `programId != null` (`"Challenge"` or `"Challenge (Ended)"`)
* **Actions**:
  * **Back**: Closes Quick-View card without opening edit mode.
  * **Edit**: Closes Quick-View card and opens `EditHabitModal` pre-populated for that habit.
  * **Delete**: Opens confirmation prompt and calls `DELETE /api/habits/:id` (soft-archive `isActive: false`), then refreshes calendar.

### `UI-S2-02`: Habit & Challenge Category Inputs (`NewHabitModal.tsx`, `EditHabitModal.tsx`, `ProgramBuilder.tsx`)
* **Category Dropdown (`FR-S2-02`)**:
  * Options on `NewHabitModal` / `EditHabitModal`: `""` (`Uncategorized / None`), `Health & Fitness`, `Sleep & Recovery`, `Mindfulness`, `Productivity`, `Learning`, `Finance`, `Social`, `Home`, `Hobbies`, `__CUSTOM__` (`Custom...`).
  * Options on `ProgramBuilder.tsx`: the 9 presets (`Health & Fitness` default) + `__CUSTOM__` (`Custom...`) (required `1–50` chars, no `"Uncategorized"`).
  * Selecting `Custom...` reveals a text input (`maxLength={50}`) for a custom category label.
  * Pre-existing custom/legacy categories not in the 9 presets automatically select `Custom...` and populate the custom input when editing.
* **Color Picker (`FR-05`, `BR-02` — Unchanged from Sprint 1)**:
  * `ColorPicker.tsx` continues rendering Sprint 1's 8 fixed circular swatches inside `role="radiogroup"`.

### `UI-S2-03`: Participant Dashboard (`/dashboard`, `DashboardPage.tsx`)
* **Section 1 — Today's Focus Snippet (`FR-S2-04`)**:
  * Monday–Sunday 7-day strip displaying day label (`Mon`..`Sun`), day number, and highlighted current day column (`aria-current="date"`).
  * Compact list of habits due today with habit color dot, category pill, completion toggle checkbox, and daily tally (`completed / scheduled`).
* **Section 2 — Weekly Habit Progress Bars (`FR-S2-05`)**:
  * One card/row per active habit due this Mon–Sun week showing habit title, habit color progress bar (`completedDaysThisWeek / scheduledDaysThisWeek`), and numeric ratio (`e.g. 3 / 7`).
* **Section 3 — Program Completion Bar (`FR-S2-06`)**:
  * Global banner card showing `"Active Program Completion"` with Walnut/Golden Sand progress bar (`totalCompletedLogs / totalScheduledDaysToDate` and percentage).

### `UI-S2-04`: All Habits Directory (`/habits`) & Individual Habit Statistics (`/habits/:id/stats`)
* **`/habits` (`HabitsDirectoryPage.tsx`, `FR-S2-07`)**:
  * Filterable/searchable vertical list of all active participant habits displaying color swatch, title, category badge, frequency, `"View Stats"` button, and optional `"Challenge"` / `"Challenge (Ended)"` tag.
  * Clicking any habit row navigates to `/habits/:id/stats`.
* **`/habits/:id/stats` (`HabitStatsPage.tsx`, `FR-S2-08`, `FR-S2-09`)**:
  * **Header**: Back button to `/habits`, habit title, category badge, frequency, and color chip.
  * **Streak Counters**: Two metric cards — **Current Streak** (`X days`) and **Highest Streak** (`Y days`).
  * **Completion Heatmap**:
    * Toggle control: `[ Month ]` | `[ Year ]` + month/year navigation arrows.
    * **Month Mode**: Compact 7-column daily square matrix for the selected month sharing the square-tile aesthetic, where unlogged/future days render as subtle neutral empty squares (`#efe6da` / `0` opacity fill) and completed days render at `1.0` opacity in the habit's assigned Sprint 1 palette `colorHex` with `title` and `aria-label` tooltips (`"YYYY-MM-DD: Completed"` or `"YYYY-MM-DD: Not completed"`).
    * **Year Mode**: GitHub / AniList-style 7-row (`Mon`–`Sun`, subtle `Mon`, `Wed`, `Fri` row labels on the left) × 53-column daily contribution grid covering all 365/366 days (`Jan 1`–`Dec 31`), with leading spacer cells before `Jan 1` for weekday alignment, `Jan`–`Dec` month labels positioned across the top aligned with each month's first week column, crisp small rounded squares (`12px–14px` with `3px–4px` gap and `2px–3px` border-radius, scrollable horizontally on narrow viewports so squares never squish), neutral empty fill (`#efe6da`) for unlogged/future days (`opacity: 0`), `habit.colorHex` (`opacity: 1.0`) for completed days, hover/focus `title` + `aria-label` tooltips (`"YYYY-MM-DD: Completed"` / `"YYYY-MM-DD: Not completed"`), and a compact legend (`Not completed` / `Completed`).

### `UI-S2-05`: Interactive Challenges Hub (`/challenges`, `ChallengesHubPage.tsx`) & Challenge Badges
* **Discovery Bar (`FR-S2-10`)**: Search input (title/description), Category dropdown, and Enrollment Status filter (`All`, `Available`, `Enrolled`, `Ended`).
* **Challenge Cards**: Category pill, title, organizer name, date range, activity count, enrollment count, average star rating (`★ 4.6 (5)`), and status/action button (`Join Challenge` / `Enrolled` / `Re-Join` / `View Details`).
* **In-Calendar & Modal Challenge Badges (`FR-S2-11`, `FR-S2-12`, `FR-S2-13`)**:
  * Imported habits on `CalendarMatrix` and `HabitsDirectoryPage` display a clickable `"Challenge"` pill (Golden Sand) or `"Challenge (Ended)"` pill (Light Coral) when unpublished.
  * Clicking the badge opens a **Challenge Info Popup Modal** showing:
    * Full challenge metadata, activities, `1–5` star rating widget, and comment thread (for `ACTIVE` / `COMPLETED` participants).
    * **Leave Challenge** button (for `ACTIVE` challenges) opening the Keep vs. Remove prompt (**Keep as Personal Habits** vs. **Remove Habits**).
    * **Keep as Personal Habits** / **Remove Habits** prompt banner automatically highlighted when `challengeStatus === 'ENDED'`.
    * **`"Update Available"`** banner with **"Sync Changes"** button whenever `updateAvailable === true` (`syncedVersion < latestProgramVersion`).

---

## 4. Program Manager Screens (`UI-S2-*`)

### `UI-S2-06`: Program Manager Dashboard (`/manager/dashboard`, `ManagerDashboardPage.tsx`)
* **Summary KPI Strip**: Total Published Challenges, Total Active Enrollments, Total Completed Enrollments (`FR-S2-15`).
* **Most Popular Challenges Panel**: Ranked table/cards of platform-wide challenges by enrollment count (`title`, `category`, `managerName`, `enrollmentCount`, `averageRating`).
* **Top Categories Panel**: Ranked breakdown by `category` showing challenge count, total enrollments, and completion rate progress bar. Non-preset custom categories are grouped and displayed as `"Other"` at the top level, with an expand/inspect control revealing the underlying custom category names (`customCategories[]`).
* Clicking any challenge card navigates to `/manager/challenges/:id` (`UI-S2-08`).

### `UI-S2-07`: Global Challenges Directory (`/manager/challenges`, `ManagerDirectoryPage.tsx`)
* Searchable/filterable grid of all `PUBLISHED` challenges across all Program Managers (`FR-S2-16`).
* Distinguishes manager's own challenges (`"Your Program"` badge) from other managers' challenges (view-only).
* Clicking any challenge card navigates to `/manager/challenges/:id`.

### `UI-S2-08`: Read-Only Challenge Detail View Page (`/manager/challenges/:id`, `ManagerChallengeDetailPage.tsx`)
* **Strictly Read-Only Program Metadata (`FR-S2-16`)**: Displays title, category, organizer, duration, description, target activities/frequencies, ratings summary, and a **Back** navigation button.
* **No Management Buttons**: Edit, Publish, Unpublish, Archive, and Delete actions are intentionally omitted here and remain centralized in `ProgramBuilder.tsx` on `/manager`.
* **Comment Threads & Replies**: Displays participant comments and allows the Program Manager to post 1-level replies directly under any top-level comment.

### `UI-S2-09`: In-Place Challenge Layout Preview (`ProgramBuilder.tsx` & `ChallengeInvitationCard.tsx`, `FR-S2-17`)
* **Create/Edit Modal `Edit | Preview` Tabs**: Adds a segmented **Edit** / **Preview** tab bar (`role="tablist"`) inside `ProgramBuilder.tsx`'s Challenge modal so Program Managers can toggle live between editing form fields and viewing the participant invitation card layout (`ChallengeInvitationCard` with `previewMode={true}`) before saving or publishing, while preserving all unsaved inputs when switching tabs.
* **Per-Row `Preview` Action (`DRAFT`, `PUBLISHED`, `ARCHIVED`)**: Adds a **Preview** button to every row in the Challenge Programs management table on `/manager`, opening a view-only preview modal (`role="dialog"`, `aria-modal="true"`) rendering `ChallengeInvitationCard` (`previewMode={true}`) alongside its status badge (`DRAFT`, `PUBLISHED`, or `ARCHIVED`) without navigating away from `/manager`.
* **Preview Mode Behavior**: Displays organizer name, category badge, title, duration, guidelines, and activity schedules/targets using the Warm Natural Shell tokens; replaces/disables the enrollment button (`"Preview Mode — Join Disabled"`) so no enrollment mutation occurs, and provides a **Close** button to exit preview.
