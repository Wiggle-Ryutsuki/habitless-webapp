# HabitLess Sprint 2 REST API Specification

**Document ID**: API-SPEC-HL-02  
**Version**: 1.0  
**Status**: Approved API Contract Baseline (Sprint 2)  
**Parent Project**: HabitLess - Habit and Activity Tracking System  
**Baseline Reference**: [`docs/sprint-01/api-spec.md`](../sprint-01/api-spec.md) (`API-SPEC-HL-01`, v1.5)  
**Engineering Spec**: [`docs/sprint-02/specification.md`](specification.md)

---

## 1. Global API Conventions

All Sprint 1 conventions remain active (`api-spec.md`, Sec. 1–2):
* **Base URL**: `/api`
* **Format**: `application/json`, `camelCase` JSON properties, ISO 8601 UTC timestamps, `YYYY-MM-DD` date strings.
* **Auth**: HTTP-only cookie `token` or `Authorization: Bearer <token>`.
* **Error Envelope**:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable description",
      "fieldErrors": [{ "field": "fieldName", "message": "Validation detail" }],
      "correlationId": "hl-req-..."
    }
  }
  ```

---

## 2. Updated Sprint 1 Endpoints (Sprint 2 Extensions)

### 2.1. Habit Management (`/api/habits`) — `FR-S2-02`, `FR-S2-03` (Preserves Sprint 1 `FR-05` / `BR-02`)

#### `POST /api/habits` & `PUT /api/habits/:id`
* **Updated Fields**:
  * `colorHex` (Sprint 1 `BR-02` preserved): Required on `POST`, optional on `PUT`. Enforces Sprint 1's fixed 8-color palette allowlist in `server/src/utils/palette-validator.ts` (`#448aff`, `#1565c0`, `#009688`, `#8bc34a`, `#ffc107`, `#ff9800`, `#f44336`, `#ad1457`; or `#RRGGBBff` normalized to lowercase `#rrggbb`). Non-palette or malformed hexes return HTTP `422` (`INVALID_HABIT_COLOR`).
  * `category` (`BR-S2-02`): Optional nullable string, trimmed, max `50` chars (9 presets: `Health & Fitness`, `Sleep & Recovery`, `Mindfulness`, `Productivity`, `Learning`, `Finance`, `Social`, `Home`, `Hobbies`, or custom string). Empty string normalizes to `null`. Strings > 50 chars return HTTP `422` (`INVALID_HABIT_CATEGORY`).
  * `frequency` (`BR-S2-04`): Supported Sprint 2 frequencies are Daily (`DAILY`), Certain Days (`WEEKDAYS`, `THREE_TIMES_WEEKLY`, `CUSTOM_DAYS`), and Weekly (`WEEKLY`).
* **Updated Habit DTO** (returned by `GET /api/habits`, `POST /api/habits`, `GET /api/habits/:id`, `PUT /api/habits/:id`):
  ```json
  {
    "id": 101,
    "userId": 10,
    "title": "Journal",
    "description": "Daily reflection before bed",
    "category": "Mindfulness",
    "colorHex": "#ff9800",
    "frequency": "DAILY",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": null,
    "targetCount": 20,
    "isActive": true,
    "programId": null,
    "sourceActivityId": null,
    "challengeStatus": null,
    "syncedVersion": null,
    "createdAt": "2026-11-01T08:00:00.000Z",
    "updatedAt": "2026-11-01T08:00:00.000Z"
  }
  ```

#### `DELETE /api/habits/:id`
* Unchanged soft-archive semantics (`isActive: false`, HTTP `204 No Content`), now also invoked from the Habit Quick-View Card **Delete** button (`BR-S2-03`).

---

### 2.2. Tracking Calendar & Today Checklist (`/api/tracking/calendar`, `/api/tracking/today`) — `FR-S2-03`, `FR-S2-11`, `FR-S2-13`

#### `GET /api/tracking/calendar?month=M&year=YYYY`
* Each item in `habits[]` now includes Sprint 2 metadata so the Quick-View Card and `"Challenge"` / `"Challenge (Ended)"` / `"Update Available"` UI render without N+1 fetches:
  ```json
  {
    "habitId": 101,
    "title": "Daily Hydration (2L)",
    "description": "Drink 2L water",
    "category": "Health & Fitness",
    "colorHex": "#448aff",
    "frequency": "DAILY",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": "2026-11-30T23:59:59.000Z",
    "targetCount": 20,
    "goalAchievedCount": 12,
    "programId": 5,
    "programTitle": "30-Day Wellness Challenge",
    "challengeStatus": "ACTIVE",
    "syncedVersion": 1,
    "latestProgramVersion": 2,
    "updateAvailable": true,
    "days": { "1": true, "2": false }
  }
  ```

#### `GET /api/tracking/today?date=YYYY-MM-DD`
* Each item in `items[]` additionally includes `category`, `programId`, `challengeStatus`, and `updateAvailable`.

---

### 2.3. Manager Programs Lifecycle (`/api/manager/programs/*`) — `FR-S2-16`, `BR-S2-07`, `BR-S2-08`

#### `PUT /api/manager/programs/:id` (Draft Update)
* When `existing.previouslyPublished === true`, if `title`, `description`, `startDate`, `endDate`, or `activities` (titles, frequencies, daysOfWeek, targetCount, added/removed activities) differ from the prior snapshot, sets `hasTemplateEditsSincePublish = true`.

#### `PUT /api/manager/programs/:id/deploy` (Publish / Republish)
* **Behavior**:
  * If `status === 'DRAFT'`:
    * Sets `status = 'PUBLISHED'`.
    * If `previouslyPublished === true && hasTemplateEditsSincePublish === true`: increments `version += 1` and resets `hasTemplateEditsSincePublish = false`.
    * If `previouslyPublished === true && hasTemplateEditsSincePublish === false` (unchanged republish): `version` is unchanged; unresolved `ProgramEnrollment` rows that have at least one active habit with `challengeStatus === 'ENDED'` are reactivated (`isActive: true`, `status: 'ACTIVE'`), and those habits are restored from `challengeStatus: 'ENDED'` to `'ACTIVE'` (`BR-S2-08`).
    * If `previouslyPublished === true && hasTemplateEditsSincePublish === true` (edited republish): unresolved `ENDED` habits are also restored to `'ACTIVE'` with their `syncedVersion` unchanged so they surface `"Update Available"` (`syncedVersion < version`).
* **Response `200 OK`**: Includes `version` and `restoredEnrollmentsCount`.

#### `PUT /api/manager/programs/:id/unpublish`
* Transitions `PUBLISHED -> DRAFT`, sets `previouslyPublished = true`, sets `ProgramEnrollment.isActive = false` for `ACTIVE` enrollments (keeping `ProgramEnrollment.status = 'ACTIVE'` until participant resolves Keep/Remove or unchanged republish restores it), and updates all participant `Habit` rows with `programId = id` and `challengeStatus = 'ACTIVE'` to `challengeStatus = 'ENDED'`.

---

## 3. New Sprint 2 Participant Endpoints

### 3.1. Participant Dashboard & Habit Statistics

#### `API-S2-01`: `GET /api/tracking/dashboard`
* **Purpose**: Power `/dashboard` (`FR-S2-04`, `FR-S2-05`, `FR-S2-06`).
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**: `date` (optional `YYYY-MM-DD`, defaults to current UTC date).
* **Response `200 OK`**:
  ```json
  {
    "date": "2026-11-26",
    "weekStart": "2026-11-23",
    "weekEnd": "2026-11-29",
    "weekDays": [
      { "date": "2026-11-23", "dayLabel": "Mon", "dayNumber": 23, "isToday": false },
      { "date": "2026-11-26", "dayLabel": "Thu", "dayNumber": 26, "isToday": true }
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

#### `API-S2-02`: `GET /api/habits/:id/stats`
* **Purpose**: Power `/habits/:id/stats` (`FR-S2-08`, `FR-S2-09`, `BR-S2-05`).
* **Access**: Authenticated (`PARTICIPANT` owner; returns `404 HABIT_NOT_FOUND` if missing or unowned).
* **Query Parameters**:
  * `mode` (optional `"month" | "year"`, default `"month"`).
  * `month` (optional `1–12`, used when `mode=month`, defaults to current month).
  * `year` (optional 4-digit year, defaults to current year).
  * `date` (optional `YYYY-MM-DD` anchor for "today" timezone fidelity).
* **Response `200 OK`**:
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
      "programId": null,
      "challengeStatus": null
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
* **Year Heatmap Semantics (`mode=year`)**: Returns all **365/366 daily cells** (`Jan 1` through `Dec 31` of `year`) ordered chronologically (`YYYY-MM-DD`). Each cell includes `weekday` (`1 = Mon`..`7 = Sun`), `weekIndex` (`0..52` alignment column for the 7-row contribution grid), `month` (`1..12`), `scheduled` (`boolean`), `completedCount` (`0 | 1`), `scheduledCount` (`0 | 1`), and `opacity` (`0` for unlogged or future days rendered as neutral empty squares; `1.0` for completed days `<= anchorToday` shaded in the habit's assigned Sprint 1 palette `colorHex`) (`FR-S2-08`, `BR-S2-05`).
  ```json
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
  ```

---

### 3.2. Challenges Hub, Enrollment Lifecycle, Sync, Ratings & Comments

#### `API-S2-03`: `GET /api/challenges`
* **Purpose**: Participant Challenges Hub directory (`FR-S2-10`).
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**:
  * `q` (optional search string matching `title` or `description`, case-insensitive).
  * `category` (optional category filter).
  * `status` (optional filter: `ALL` [default], `ENROLLED`, `AVAILABLE`, `ENDED`).
* **Response `200 OK`**:
  ```json
  [
    {
      "id": 5,
      "title": "30-Day Wellness Challenge",
      "description": "Establish foundational daily routines...",
      "category": "Wellness",
      "startDate": "2026-11-01T00:00:00.000Z",
      "endDate": "2026-11-30T23:59:59.000Z",
      "status": "PUBLISHED",
      "version": 1,
      "manager": { "fullName": "Dr. Jordan Wells (Wellness Director)" },
      "activitiesCount": 3,
      "enrollmentsCount": 14,
      "averageRating": 4.6,
      "ratingsCount": 5,
      "myEnrollment": {
        "status": "ACTIVE",
        "enrolledAt": "2026-11-02T09:00:00.000Z"
      }
    }
  ]
  ```

#### `API-S2-04`: `GET /api/challenges/:id` (Extended)
* **Purpose**: Public/authenticated challenge detail view (`FR-S2-11`, `FR-S2-14`).
* **Visibility**: Returns `PUBLISHED` programs to anyone; also returns `DRAFT` (`previouslyPublished: true`) to participants who currently have an active or unresolved `ENDED` enrollment so the `"Challenge (Ended)"` modal popup can render challenge info (`404 CHALLENGE_NOT_FOUND` otherwise).
* **Response Extensions**: Adds `version`, `averageRating`, `ratingsCount`, `myRating`, `myEnrollment` (`{ status, enrolledAt, hasUnresolvedEndedHabits, updateAvailable }`), and `comments[]` (top-level comments with nested `replies[]`).

#### `API-S2-05`: `POST /api/challenges/:id/join` (Updated for Re-Enrollment & Snapshot Links)
* **Purpose**: Accept challenge and clone `ProgramActivity` snapshot (`FR-S2-11`, `FR-S2-12`, `BR-S2-06`).
* **Behavior**:
  * If existing enrollment has `status === 'ACTIVE'` and `isActive === true`: returns `409 ALREADY_ENROLLED`.
  * If existing enrollment has `status === 'LEFT'`: updates enrollment to `status: 'ACTIVE', isActive: true, leftAt: null, enrolledAt: now()` and clones fresh `Habit` rows.
  * Each cloned `Habit` sets `programId: challenge.id`, `sourceActivityId: act.id`, `challengeStatus: 'ACTIVE'`, `syncedVersion: challenge.version`, `category: challenge.category` (truncated to 50 chars if needed).

#### `API-S2-06`: `POST /api/challenges/:id/leave`
* **Purpose**: Leave an active challenge or resolve an ended challenge (`FR-S2-12`, `FR-S2-13`, `BR-S2-06`).
* **Access**: Authenticated (`PARTICIPANT`).
* **Request Body**:
  ```json
  { "action": "KEEP" }
  ```
  (`action` must be `"KEEP"` or `"REMOVE"`, otherwise HTTP `422 VALIDATION_ERROR`).
* **Behavior**:
  * Validates participant has an enrollment (or unresolved `ENDED` habits) for program `:id`; otherwise `404 ENROLLMENT_NOT_FOUND`.
  * Updates `ProgramEnrollment` to `status: 'LEFT', isActive: false, leftAt: now()`.
  * If `action === 'KEEP'`: updates matching habits (`userId`, `programId = id`, `isActive = true`) to `{ programId: null, sourceActivityId: null, challengeStatus: null, syncedVersion: null }`.
  * If `action === 'REMOVE'`: updates matching habits (`userId`, `programId = id`, `isActive = true`) to `{ isActive: false }`.
* **Response `200 OK`**:
  ```json
  {
    "programId": 5,
    "action": "KEEP",
    "affectedHabitsCount": 3,
    "message": "Challenge habits converted to personal habits."
  }
  ```

#### `API-S2-07`: `POST /api/challenges/:id/sync`
* **Purpose**: Apply updated challenge template changes to existing participant snapshot (`FR-S2-13`, `BR-S2-08`).
* **Access**: Authenticated (`PARTICIPANT` with `ACTIVE` enrollment).
* **Behavior**:
  * For each `ProgramActivity` on the `PUBLISHED` challenge:
    * If participant has an active habit with `sourceActivityId === act.id`: updates `title`, `description`, `frequency`, `daysOfWeek`, `targetCount`, `endDate: challenge.endDate`, `syncedVersion: challenge.version`. Never deletes or modifies `HabitLog` records.
    * If no habit exists for `act.id`: clones a new `Habit` with `programId: challenge.id`, `sourceActivityId: act.id`, `challengeStatus: 'ACTIVE'`, `syncedVersion: challenge.version`.
  * Existing habits whose `sourceActivityId` is no longer in `challenge.activities` keep their logs and have `syncedVersion` updated to `challenge.version`.
* **Response `200 OK`**: `{ "programId": 5, "syncedVersion": 2, "updatedCount": 2, "addedCount": 1 }`.

#### `API-S2-08`: `PUT /api/challenges/:id/rating`
* **Purpose**: Submit or update a `1–5` star rating (`FR-S2-14`, `BR-S2-09`).
* **Access**: Authenticated (`PARTICIPANT` with `ACTIVE` or `COMPLETED` enrollment; otherwise `403 ENROLLMENT_REQUIRED`).
* **Request Body**: `{ "rating": 5 }` (integer `1..5`; otherwise `422 INVALID_RATING`).
* **Response `200 OK`**: `{ "programId": 5, "rating": 5, "averageRating": 4.7, "ratingsCount": 6 }`.

#### `API-S2-09`: `POST /api/challenges/:id/comments`
* **Purpose**: Post a participant comment or a Program Manager 1-level reply (`FR-S2-14`, `FR-S2-16`, `BR-S2-09`).
* **Access**:
  * Top-level comment (`parentCommentId` omitted/`null`): `PARTICIPANT` with `ACTIVE` or `COMPLETED` enrollment (`403 ENROLLMENT_REQUIRED` otherwise; `PROGRAM_MANAGER` rejected with `403` for top-level comments).
  * Reply (`parentCommentId` integer): `PROGRAM_MANAGER` only (`403` for `PARTICIPANT`). Target parent comment must belong to program `:id` and have `parentCommentId === null` (`422 NESTED_REPLY_NOT_ALLOWED` if replying to a reply; `404 COMMENT_NOT_FOUND` if missing).
* **Request Body**: `{ "content": "Great structure!", "parentCommentId": null }` (`1–500` chars trimmed; `422 INVALID_COMMENT_CONTENT`).
* **Response `201 Created`**: Comment DTO with `id`, `programId`, `parentCommentId`, `content`, `author: { id, fullName, role }`, `createdAt`.

---

## 4. New Sprint 2 Program Manager Endpoints

#### `API-S2-10`: `GET /api/manager/analytics`
* **Purpose**: Platform-wide analytics for `/manager/dashboard` (`FR-S2-15`).
* **Access**: Authenticated (`PROGRAM_MANAGER`).
* **Response `200 OK`**:
  ```json
  {
    "summary": {
      "totalPublishedChallenges": 8,
      "totalActiveEnrollments": 42,
      "totalCompletedEnrollments": 12
    },
    "mostPopularChallenges": [
      {
        "id": 5,
        "title": "30-Day Wellness Challenge",
        "category": "Wellness",
        "managerName": "Dr. Jordan Wells (Wellness Director)",
        "enrollmentCount": 18,
        "averageRating": 4.6
      }
    ],
    "topCategories": [
      {
        "category": "Health & Fitness",
        "isPreset": true,
        "challengesCount": 3,
        "totalEnrollments": 28,
        "completionRate": 74
      },
      {
        "category": "Other",
        "isPreset": false,
        "challengesCount": 2,
        "totalEnrollments": 14,
        "completionRate": 68,
        "customCategories": [
          {
            "category": "Wellness",
            "challengesCount": 1,
            "totalEnrollments": 10,
            "completionRate": 70
          },
          {
            "category": "Digital Detox",
            "challengesCount": 1,
            "totalEnrollments": 4,
            "completionRate": 63
          }
        ]
      }
    ]
  }
  ```
  *(Any non-preset `ChallengeProgram.category` is rolled up under `"Other"` in `topCategories[]` with its individual custom category names available in `customCategories[]` for drill-down inspection.)*

#### `API-S2-11`: `GET /api/manager/directory`
* **Purpose**: Global Challenges Directory across all Program Managers (`FR-S2-16`, `BR-S2-10`).
* **Access**: Authenticated (`PROGRAM_MANAGER`).
* **Query Parameters**: `q` (search), `category` (filter).
* **Behavior**: Returns all `PUBLISHED` programs across all managers, flagging `isOwnedByMe: program.managerId === req.user.id`.

#### `API-S2-12`: `GET /api/manager/directory/:id`
* **Purpose**: Read-only Challenge Detail View Page data (`/manager/challenges/:id`, `FR-S2-16`, `BR-S2-10`).
* **Access**: Authenticated (`PROGRAM_MANAGER`).
* **Behavior**: Returns full details (description, start/end dates, activities with frequencies, `isOwnedByMe`, ratings summary, and threaded `comments[]`) for any `PUBLISHED` challenge (or any status if `program.managerId === req.user.id`). Returns `404 CHALLENGE_NOT_FOUND` otherwise.
