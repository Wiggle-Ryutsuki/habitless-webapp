# HabitLess Software Test Specification

**Document ID**: TEST-HL-01  
**Version**: 1.5  
**Status**: Planned Test Specification Baseline (Strict MVP Scope - Unified Habit Calendar Architecture)  
**Parent Project**: HabitLess - Habit and Activity Tracking System  
**Source Brief Reference**: `HabitLess App Design: Habit and Activity Tracking System (pp. 1–5)`  
**Scope Boundary**: Strictly High Priority / Low Effort [MVP] Features Only  
**Platform Compliance**: Node.js, Express, Vitest, Supertest, React Testing Library, Playwright  

---

## 1. Test Strategy

HabitLess employs a multi-tiered automated testing hierarchy designed to validate functional requirements, business rules, role-based security boundaries, and responsive usability for the bare-minimum MVP:

1. **Unit Tests (Vitest)**:
   * Test pure business logic: fixed habit color palette enforcement (8 tokens), schedule date range invariants, frequency schedule calculators, and monthly goal achievement counters without external dependencies.
2. **API Integration Tests (Vitest + Supertest)**:
   * Test Express route handlers, database operations, idempotent daily toggles, role-based barriers (`PARTICIPANT` vs `PROGRAM_MANAGER`), reflection notes, and challenge deployment.
   * Verify system readiness probes (`GET /api/health` and `GET /api/ready`).
3. **UI Component Tests (Vitest + React Testing Library + jsdom)**:
   * Test React UI components in isolation: registration role selector, login error displays, 8-habit-color swatch picker, Today's Checklist toggle, 31-day desktop calendar matrix with Goal Achieved column, in-calendar edit modal, Notes section with `+ New Note`, and Program Builder.
4. **End-to-End Tests (Playwright)**:
   * Test complete end-to-end user journeys in real browsers:
     * **Journey A (Participant Workflow)**: Registration &rarr; Land on `/calendar` (Habit Calendar) &rarr; Create habit with fixed habit color &rarr; Habit appears in side daily habits list and calendar row &rarr; Check off today in the illuminated active day column &rarr; Verify goal count &rarr; Click "Dashboard" and verify "Dashboard is still under construction" popup notification.
     * **Journey B (In-Calendar Tracking & Editing)**: Open calendar desktop &rarr; Toggle past calendar cell &rarr; Click Edit on habit row &rarr; Change habit title &rarr; Confirm update.
     * **Journey C (Program Manager Challenge & Web Deploy)**: Login as Manager &rarr; Create "30-Day Wellness Challenge" with activities &rarr; Deploy to web &rarr; Join challenge via web invite link as participant.

---

## 2. Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UT-01** | Unit | BR-02, FR-05 | Fixed habit palette color validator | Accepts the 8 official habit palette colors (`#448aff`, `#1565c0`, `#009688`, `#8bc34a`, `#ffc107`, `#ff9800`, `#f44336`, `#ad1457`); rejects arbitrary hex colors | `server/tests/sprint-01/palette-validator.test.ts` | Planned |
| **UT-02** | Unit | BR-05, FR-04 | Date range invariant validator | Accepts `endDate >= startDate`; rejects `endDate < startDate` | `server/tests/sprint-01/schedule-validator.test.ts` | Planned |
| **UT-03** | Unit | FR-06 | Frequency schedule generator | Correctly determines if a habit is active on a given date (Daily, Weekdays, 3x/week, Weekly, Monthly) | `server/tests/sprint-01/frequency.test.ts` | Planned |
| **UT-04** | Unit | FR-11 | Monthly Goals tracker calculation | Aggregates total completed instances for a habit within the target month | `server/tests/sprint-01/goals.test.ts` | Planned |
| **API-01** | API | FR-03 | `GET /api/health` and `GET /api/ready` | Returns HTTP 200 with DB status; returns HTTP 503 if DB is unreachable | `server/tests/sprint-01/health.api.test.ts` | Planned |
| **API-02** | API | FR-01, AC-01 | `POST /api/auth/register` (Participant) | Creates user with `role=PARTICIPANT`, hashes password, returns HTTP 201 and token | `server/tests/sprint-01/auth.api.test.ts` | Planned |
| **API-03** | API | FR-01 | `POST /api/auth/register` (Duplicate email) | Returns HTTP 409 Conflict when registering an existing email address | `server/tests/sprint-01/auth.api.test.ts` | Planned |
| **API-04** | API | FR-02, AC-02 | `POST /api/auth/login` (Valid & Invalid) | Returns HTTP 200 on valid credentials; returns HTTP 401 on incorrect password | `server/tests/sprint-01/auth.api.test.ts` | Planned |
| **API-05** | API | FR-04, FR-05, AC-03 | `POST /api/habits` (Valid habit creation) | Saves habit with fixed habit color (e.g. `#ff9800`), frequency, and target count; returns HTTP 201 | `server/tests/sprint-01/habits.api.test.ts` | Planned |
| **API-06** | API | BR-02, AC-04 | `POST /api/habits` (Invalid color rejection) | Returns HTTP 422 Unprocessable Entity when submitting non-palette hex color | `server/tests/sprint-01/habits.api.test.ts` | Planned |
| **API-07** | API | BR-01 | `GET /api/habits` (User data isolation) | Returns only habits belonging to the authenticated participant | `server/tests/sprint-01/habits.api.test.ts` | Planned |
| **API-08** | API | FR-10, AC-07 | `PUT /api/habits/:id` (In-calendar habit edit) | Updates habit title, target count, and settings; returns HTTP 200 with updated DTO | `server/tests/sprint-01/habits.api.test.ts` | Planned |
| **API-09** | API | FR-07, FR-08, AC-05 | `POST /api/tracking/log` (Idempotent toggle) | Creates completion record; subsequent toggle deletes/unchecks idempotently | `server/tests/sprint-01/tracking.api.test.ts` | Planned |
| **API-10** | API | FR-09, FR-11, AC-06 | `GET /api/tracking/calendar` | Returns 31-day month grid with completion cells in habit colors, target counts, and goal achieved sums | `server/tests/sprint-01/calendar.api.test.ts` | Planned |
| **API-11** | API | FR-12, AC-08 | `POST /api/tracking/notes` | Creates timestamped reflection note; returns HTTP 201 | `server/tests/sprint-01/notes.api.test.ts` | Planned |
| **API-12** | API | FR-13, FR-14 | `POST /api/manager/programs` | Program Manager creates challenge with activities; returns HTTP 201 | `server/tests/sprint-01/manager.api.test.ts` | Planned |
| **API-13** | API | BR-01 | `POST /api/manager/programs` (Role barrier) | Returns HTTP 403 Forbidden if called by a user with role `PARTICIPANT` | `server/tests/sprint-01/manager.api.test.ts` | Planned |
| **API-14** | API | FR-15, AC-09 | `PUT /api/manager/programs/:id/deploy` | Deploys challenge, transitions status to `PUBLISHED`, returns web invite link | `server/tests/sprint-01/manager.api.test.ts` | Planned |
| **API-15** | API | FR-15 | `POST /api/challenges/:id/join` | Participant enrolls in deployed challenge; returns HTTP 201 | `server/tests/sprint-01/challenges.api.test.ts` | Planned |
| **UI-01** | UI | FR-01, FR-02 | Auth Form Component | Renders role selector, email/password inputs, and handles submission | `client/tests/sprint-01/AuthForm.test.tsx` | Planned |
| **UI-02** | UI | FR-05, AC-04 | Color Swatch Picker Component | Renders 8 fixed habit palette swatches; enforces single palette selection | `client/tests/sprint-01/ColorPicker.test.tsx` | Planned |
| **UI-03** | UI | FR-07, FR-08, AC-05 | Habit Calendar Side Habits & Active Day Toggle | Renders side list of daily habits, illuminates active day column in date header, handles check toggle, updates completion state | `client/tests/sprint-01/TodayChecklist.test.tsx` | Planned |
| **UI-04** | UI | FR-09, FR-11, AC-06 | Calendar Desktop Matrix Component | Renders days 1–31 with day initials, sticky habit column, goal column, and color-coded checkmarks | `client/tests/sprint-01/CalendarMatrix.test.tsx` | Planned |
| **UI-05** | UI | FR-10, AC-07 | In-Calendar Habit Edit Modal | Opens from habit row edit button; handles title, color, and settings modification | `client/tests/sprint-01/EditHabitModal.test.tsx` | Planned |
| **UI-06** | UI | FR-12, AC-08 | Calendar Notes Feed Component | Renders timestamped notes list and handles `+ New Note` submission | `client/tests/sprint-01/CalendarNotes.test.tsx` | Planned |
| **UI-07** | UI | FR-13, FR-14, FR-15 | Program Builder Component | Manages dynamic activity rows, date schedules, and deploy to web action | `client/tests/sprint-01/ProgramBuilder.test.tsx` | Planned |
| **UI-08** | UI | FR-07, AC-06 | Dashboard Under-Construction Notification | Clicking Dashboard nav link or accessing `/dashboard` displays 'Dashboard is still under construction' notification toast and card | `client/tests/sprint-01/DashboardPlaceholder.test.tsx` | Planned |
| **E2E-01** | E2E | AC-01, AC-03, AC-05, AC-06 | Complete Participant Tracking Journey | Register &rarr; Land on `/calendar` &rarr; Create habit &rarr; Check off in illuminated column &rarr; Click Dashboard and verify 'still under construction' popup | `e2e/sprint-01/participant-journey.spec.ts` | Planned |
| **E2E-02** | E2E | AC-06, AC-07, AC-08 | In-Calendar Tracking, Editing & Notes | View calendar desktop &rarr; Toggle past cell &rarr; Edit habit title &rarr; Add note &rarr; Verify | `e2e/sprint-01/calendar-edit.spec.ts` | Planned |
| **E2E-03** | E2E | AC-02, AC-09 | Program Manager Lifecycle Journey | Login as Manager &rarr; Create challenge &rarr; Deploy to web &rarr; Join via invite link | `e2e/sprint-01/manager-journey.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Core Feature Area | Covering Tests (Unit / API / UI / E2E) |
| :--- | :--- | :--- |
| **AC-01** | Registration & Role Assignment | `API-02`, `API-03`, `UI-01`, `E2E-01` |
| **AC-02** | Login & Role-Based Routing | `API-04`, `UI-01`, `E2E-03` |
| **AC-03** | Habit Creation with Fixed Habit Color | `UT-01`, `UT-02`, `API-05`, `UI-02`, `E2E-01` |
| **AC-04** | Invalid Habit Color Rejection | `UT-01`, `API-06`, `UI-02` |
| **AC-05** | Habit Calendar Side Habits & Active Day Toggle | `UT-03`, `API-09`, `UI-03`, `E2E-01` |
| **AC-06** | Habit Calendar Desktop & Dashboard Under Construction | `API-10`, `UI-04`, `UI-08`, `E2E-01`, `E2E-02` |
| **AC-07** | In-Calendar Habit Editing | `API-08`, `UI-05`, `E2E-02` |
| **AC-08** | Calendar Notes Section & + New Note | `API-11`, `UI-06`, `E2E-02` |
| **AC-09** | Program Manager Challenge Creation & Deployment | `API-12`, `API-13`, `API-14`, `API-15`, `UI-07`, `E2E-03` |

---

## 4. Responsive and Visual Checklist

* **Desktop Viewport (&ge; 992px)**:
  * [ ] Full 31-day desktop calendar matrix with frozen left side daily habit column (`HABITS`, with edit buttons), top date header illuminating today's editable column, and right goal achieved column (target vs achieved count).
  * [ ] Checkmark cells rendered in each habit's assigned color (from the 8 habit palette tokens).
  * [ ] Notes section rendered below calendar grid with timestamped reflection entries and `+ New Note` button.
  * [ ] Dashboard navigation link triggers 'Dashboard is still under construction' popup notification.
  * [ ] Side-by-side challenge builder and date pickers.
  * [ ] Centered content container (max-width 1200px) on Papaya Whip canvas (`#feeac7`).
* **Tablet Viewport (768px – 991px)**:
  * [ ] Horizontal scroll container for the 31-day calendar matrix with pinned habit title headers.
  * [ ] Side daily habits list wraps cleanly; challenge cards adjust to 2-column grid.
  * [ ] Form controls maintain standard 42px touch heights.
* **Mobile Viewport (< 768px)**:
  * [ ] Calendar matrix switches to an interactive 7-day rolling strip with a week selector.
  * [ ] Side daily habit items display as stacked full-width cards with large &ge;44px checkbox targets in the active day column.
  * [ ] Single-column vertical form layouts with zero horizontal viewport overflow.
  * [ ] Responsive 'under construction' toast notification when accessing Dashboard.
* **Visual & Accessibility (All Viewports)**:
  * [ ] Form fields display red asterisk (`*`) for required inputs with field-level validation messages.
  * [ ] High contrast ratios (>4.5:1) verified for Walnut text on Papaya Whip background.
  * [ ] Interactive calendar cells feature `aria-label` detailing habit, date, and completion status.
  * [ ] Top illuminated active day column features `aria-current="date"`.
  * [ ] Completed status represented by both color change and explicit checkmark glyph `✓`.

---

## 5. Test Commands

* **Run Backend Unit & API Tests**:
  ```bash
  cd server
  npm test
  ```
* **Run Frontend Unit & Component Tests**:
  ```bash
  cd client
  npm test
  ```
* **Run End-to-End Browser Tests**:
  ```bash
  npx playwright test
  ```

---

## 6. Planned Results Summary

| Test Suite | Total Planned Tests | Target Status |
| :--- | :--- | :--- |
| Server Unit Tests | 4 | Planned |
| Server API Integration Tests | 15 | Planned |
| Client UI Component Tests | 8 | Planned |
| Playwright E2E Tests | 3 | Planned |
| **Total Automated Tests** | **30** | **Planned Baseline** |

---

## 7. Known Limitations & Explicitly Deferred Tests (Non-MVP)

Per `HabitLess App Design`, pp. 4–5, all features outside High Priority / Low Effort [MVP] are deferred:

| Quadrant | Deferred Feature | Reason for Sprint 1 Exclusion |
| :--- | :--- | :--- |
| **High Priority / High Effort** | Completion Calendar / Heatmap | Dedicated heatmap grid is separate from MVP Daily Calendar |
| **High Priority / High Effort** | Statistics per habit | Deferred to analytics sprint |
| **High Priority / High Effort** | Total Habits done: Program Completion Bar | Aggregate progress bar deferred to post-MVP |
| **High Priority / High Effort** | Separate habits page | Habit viewing, editing, and daily checkoffs are unified on the Habit Calendar `/calendar` |
| **High Priority / High Effort** | Challenge packages browsing page | Marketplace catalog deferred; direct web invite URL used |
| **High Priority / High Effort** | Challenge & category popularity stats (PM) | Analytics dashboard deferred |
| **High Priority / High Effort** | Active roster & participant removal (PM) | Management admin tools deferred |
| **Low Priority / Low Effort** | Bug report form | General feedback tool deferred |
| **Low Priority / Low Effort** | Habit progress / Streaks & Highest Streak | Streak counters deferred to gamification sprint |
| **Low Priority / Low Effort** | Customizable arbitrary hex colors | MVP strictly enforces the 8 fixed habit palette colors |
| **Low Priority / High Effort** | Daily mood tracker calendar | Mood tracking deferred to mental health module |
| **Low Priority / High Effort** | Reminder notification via email/SMS | Third-party notification pipeline deferred |
| **Low Priority / High Effort** | One-click CSV export of participant logs | Export functionality deferred |
| **Low Priority / High Effort** | Challenge popularity ranking | Public leaderboard deferred |
