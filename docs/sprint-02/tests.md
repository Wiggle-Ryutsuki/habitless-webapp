# HabitLess Sprint 2 Software Test Specification

**Document ID**: TEST-HL-02  
**Version**: 1.0  
**Status**: Approved Test Specification Baseline (Sprint 2)  
**Parent Project**: HabitLess - Habit and Activity Tracking System  
**Baseline Reference**: [`docs/sprint-01/tests.md`](../sprint-01/tests.md) (`TEST-HL-01`, v1.5)  
**Platform Compliance**: Node.js, Express, Vitest, Supertest, React Testing Library, Playwright

---

## 1. Sprint 1 Test Updates Required by Sprint 2 Resolutions

Sprint 1 color-palette tests (`UT-01`, `API-06`, `UI-02`, and `UI-05`) remain **unchanged** and continue passing as-is under Sprint 1 `FR-05` / `BR-02`. Only the following Sprint 1 tests require updates for Sprint 2 category presets and the live Participant Dashboard:

| Existing Sprint 1 Test | File | Sprint 2 Required Update |
| :--- | :--- | :--- |
| **UI-07** | `client/tests/sprint-01/ProgramBuilder.test.tsx` | Update default category expectation from `'Wellness'` to `'Health & Fitness'` matching the 9 Sprint 2 category presets. |
| **E2E-03** | `e2e/sprint-01/manager-journey.spec.ts` | Update `.selectOption('Wellness')` to `.selectOption('Health & Fitness')`. |
| **UI-08** | `client/tests/sprint-01/DashboardPlaceholder.test.tsx` | Replace/retire placeholder assertion (`"Dashboard is still under construction"`) with `UI-S2-03` tests for the live Participant Dashboard (`/dashboard`). |

---

## 2. Sprint 2 Test Plan (`UT-S2-*`, `API-S2-*`, `UI-S2-*`, `E2E-S2-*`)

### 2.1. Server Unit Tests (`server/tests/sprint-02/`)

| Test ID | Requirement / BR | What It Tests | Expected Result | Automated Test File |
| :--- | :--- | :--- | :--- | :--- |
| **UT-S2-02** | FR-S2-08, FR-S2-09, BR-S2-05 | Streak calculator & Year heatmap intensity bucketing | Counts consecutive scheduled due days (skipping non-due days); computes `currentStreak` & `highestStreak`; maps ratios to `{0, 0.25, 0.5, 0.75, 1.0}`. | `server/tests/sprint-02/stats.test.ts` |
| **UT-S2-03** | FR-S2-04, FR-S2-05, BR-S2-04 | Weekly habit progress & program completion math | Evaluates Mon–Sun week boundaries, supported frequencies (`DAILY`, certain days via `daysOfWeek`, `WEEKLY`), and active challenge `completed / scheduledToDate` ratio. | `server/tests/sprint-02/dashboard-calc.test.ts` |

### 2.2. Server API Integration Tests (`server/tests/sprint-02/`)

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File |
| :--- | :--- | :--- | :--- | :--- |
| **API-S2-01** | FR-S2-02, FR-05, BR-S2-02, BR-02, AC-S2-02 | Habit creation & update with category & Sprint 1 palette enforcement | `POST`/`PUT /api/habits` persists Sprint 1 palette hex (`#448aff`) and preset (`Health & Fitness`, etc.) or custom `category`; empty `category` normalizes to `null`; `category` > 50 chars returns `422 INVALID_HABIT_CATEGORY`; non-palette hex (e.g. `#9c27b0`) returns `422 INVALID_HABIT_COLOR`. | `server/tests/sprint-02/habits-s2.api.test.ts` |
| **API-S2-02** | FR-S2-04–06, AC-S2-04 | `GET /api/tracking/dashboard` | Returns Mon–Sun `weekDays`, `todayFocus`, `weeklyProgress` (across Daily, certain-days, Weekly), and `programCompletion`; enforces `401` / `403` for non-participants. | `server/tests/sprint-02/dashboard.api.test.ts` |
| **API-S2-03** | FR-S2-08, FR-S2-09, AC-S2-05 | `GET /api/habits/:id/stats` | Returns `currentStreak`, `highestStreak`, Month mode (`0`/`1.0` opacity) and Year mode (`0`..`1.0` bucketed opacity); returns `404` for another user's habit. | `server/tests/sprint-02/habit-stats.api.test.ts` |
| **API-S2-04** | FR-S2-10, FR-S2-11, AC-S2-06 | `GET /api/challenges` & `POST /api/challenges/:id/join` | Filters/searches `PUBLISHED` challenges; joining clones `Habit` rows with `sourceActivityId`, `challengeStatus: 'ACTIVE'`, `syncedVersion`. | `server/tests/sprint-02/challenges-hub.api.test.ts` |
| **API-S2-05** | FR-S2-12, BR-S2-06, AC-S2-07 | `POST /api/challenges/:id/leave` (`KEEP` & `REMOVE`) + Re-enroll | `KEEP` clears `programId`/`sourceActivityId`/`challengeStatus` while preserving logs; `REMOVE` sets `isActive: false`; sets `ProgramEnrollment.status = 'LEFT'`; subsequent `join` succeeds. | `server/tests/sprint-02/challenges-lifecycle.api.test.ts` |
| **API-S2-06** | FR-S2-13, BR-S2-07, BR-S2-08, AC-S2-08 | Unpublish, Unchanged Republish, Edited Republish & `POST /api/challenges/:id/sync` | Unpublish sets habits to `ENDED`; unchanged republish restores `ENDED` -> `ACTIVE` (keeping `KEEP`/`REMOVE` choices untouched); edited republish increments `version`; `sync` updates via `sourceActivityId` and adds new activities without altering `HabitLog` rows. | `server/tests/sprint-02/challenges-lifecycle.api.test.ts` |
| **API-S2-07** | FR-S2-14, FR-S2-16, BR-S2-09, AC-S2-09 | `PUT /api/challenges/:id/rating` & `POST /api/challenges/:id/comments` | Rejects non-enrolled users (`403`); upserts `1–5` ratings; posts `1–500` char comments; allows Manager 1-level `parentCommentId` replies; rejects 2-level nested replies (`422`). | `server/tests/sprint-02/challenges-social.api.test.ts` |
| **API-S2-08** | FR-S2-15, FR-S2-16, BR-S2-10, AC-S2-10 | `GET /api/manager/analytics`, `GET /api/manager/directory`, `GET /api/manager/directory/:id` | Returns platform-wide popularity/category metrics (bucketing non-preset categories under `"Other"` with `customCategories[]` drill-down) and all `PUBLISHED` programs across managers; enforces `403` for `PARTICIPANT`; cross-manager edit/deploy/unpublish/delete still returns `403`. | `server/tests/sprint-02/manager-s2.api.test.ts` |

### 2.3. Client UI Component Tests (`client/tests/sprint-02/`)

| Test ID | Requirement / AC | What It Tests | Expected Result | Automated Test File |
| :--- | :--- | :--- | :--- | :--- |
| **UI-S2-01** | FR-S2-03, AC-S2-03 | `HabitQuickViewModal` & `CalendarMatrix` row click | Clicking habit row opens Quick-View showing title, description, category (or `"Uncategorized"`), frequency, dates, color; `Back` closes; `Edit` transitions to `EditHabitModal`; `Delete` triggers soft-archive. | `client/tests/sprint-02/HabitQuickViewModal.test.tsx` |
| **UI-S2-02** | FR-S2-02, FR-05 | Category dropdown (9 presets + `Custom` input) on Habit modals & `ProgramBuilder`, plus Sprint 1 8-swatch `ColorPicker` preservation | Renders 9 category presets (`Health & Fitness`, `Sleep & Recovery`, `Mindfulness`, `Productivity`, `Learning`, `Finance`, `Social`, `Home`, `Hobbies`) + `Custom...` in `NewHabitModal`, `EditHabitModal`, and `ProgramBuilder`; pre-fills non-preset/legacy categories; preserves Sprint 1's 8 fixed palette swatches in `ColorPicker` without a 9th custom color option. | `client/tests/sprint-02/HabitCustomization.test.tsx` |
| **UI-S2-03** | FR-S2-04–06, AC-S2-04 | `DashboardPage` & `isHabitDueOnDay` parity | Renders Mon–Sun week strip, Today's Focus Snippet, Weekly Habit Progress Bars (`DAILY`, certain-days, `WEEKLY`), and Program Completion Bar. | `client/tests/sprint-02/ParticipantDashboard.test.tsx` |
| **UI-S2-04** | FR-S2-07–09, AC-S2-05 | `HabitsDirectoryPage` & `HabitStatsPage` | Lists habits with category/color; toggles Month/Year heatmap with opacity shading in habit color; renders Current and Highest Streaks. | `client/tests/sprint-02/HabitStats.test.tsx` |
| **UI-S2-05** | FR-S2-10–14, AC-S2-06–09 | `ChallengesHubPage` & Challenge Info Modal | Filters/searches challenges; renders `"Challenge"`, `"Challenge (Ended)"`, and `"Update Available"` + `"Sync Changes"` UI; Leave Keep/Remove prompt; rating & comments UI. | `client/tests/sprint-02/ChallengesHub.test.tsx` |
| **UI-S2-06** | FR-S2-15, FR-S2-16, FR-S2-17, AC-S2-10, AC-S2-11 | `ManagerDashboardPage`, `ManagerDirectoryPage`, `ManagerChallengeDetailPage`, `ProgramBuilder` Preview | Renders popularity/category analytics (with non-preset categories grouped as `"Other"` and expandable to inspect custom category names), cross-manager directory, read-only detail page (no edit/publish/unpublish/delete buttons), `Back` button, comment reply form, and in-place `ProgramBuilder` Challenge Preview (**Edit \| Preview** modal tabs preserving unsaved form state + per-row **Preview** for `DRAFT`, `PUBLISHED`, and `ARCHIVED` without navigation or enrollment mutation). | `client/tests/sprint-02/ManagerSprint2.test.tsx` |

### 2.4. End-to-End Tests (`e2e/sprint-02/`)

| Test ID | Requirement / AC | Journey Covered | Automated Test File |
| :--- | :--- | :--- | :--- |
| **E2E-S2-01** | AC-S2-02–05 | Participant creates habit with Sprint 1 palette color + category -> views Quick-View Card (`Back`/`Edit`/`Delete`) -> checks Dashboard snippets/bars -> inspects `/habits/:id/stats` Month/Year heatmap & streaks. | `e2e/sprint-02/participant-customization-stats.spec.ts` |
| **E2E-S2-02** | AC-S2-06–09 | Manager publishes challenge -> Participant discovers on `/challenges`, joins, rates/comments -> Manager unpublishes (`Challenge (Ended)`), edits, republishes -> Participant sees `"Update Available"`, clicks `"Sync Changes"`, verifies logs intact -> leaves (`Keep as Personal Habits`) -> re-enrolls. | `e2e/sprint-02/challenge-sync-lifecycle.spec.ts` |
| **E2E-S2-03** | AC-S2-10, AC-S2-11 | Manager A previews draft layout in-place via modal **Preview** tab and row **Preview** button on `/manager` -> Two Program Managers -> Manager B views Manager A's challenge in `/manager/challenges` & `/manager/challenges/:id` (read-only), views `/manager/dashboard` analytics, and posts a reply to a participant comment. | `e2e/sprint-02/manager-analytics-directory.spec.ts` |
