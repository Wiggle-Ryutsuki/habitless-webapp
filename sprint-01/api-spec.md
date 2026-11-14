# HabitLess REST API Specification

**Document ID**: API-SPEC-HL-01  
**Version**: 1.5  
**Status**: Approved API Contract Baseline (Strict MVP Scope - Unified Habit Calendar Architecture)  
**Parent Project**: HabitLess - Habit and Activity Tracking System  
**Source Brief Reference**: `HabitLess App Design: Habit and Activity Tracking System (pp. 1–5)`  
**Scope Boundary**: Strictly High Priority / Low Effort [MVP] Features Only  

---

## 1. Global API Conventions

* **Base URL**: `/api` (all routes prefixed under `/api`).
* **Protocol & Data Format**: HTTP over JSON. All request and response bodies use `Content-Type: application/json`.
* **Naming Convention**: JSON property names strictly follow `camelCase`.
* **Date & Timestamp Representation**:
  * Date-time stamps: ISO 8601 UTC strings (e.g., `2026-11-13T07:00:00.000Z`).
  * Date-only tracking entries: ISO date strings formatted as `YYYY-MM-DD` (e.g., `2026-11-13`).
* **Authentication & Identity**:
  * Authentication state is transmitted via HTTP-only secure cookie `token` or `Authorization: Bearer <token>`.
  * User roles: `PARTICIPANT`, `PROGRAM_MANAGER`.
* **DTO Isolation**: Database entities are never serialized directly; all endpoints return explicitly structured Data Transfer Objects (DTOs).

---

## 2. Standard Error Envelope & Status Codes

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload failed validation.",
    "fieldErrors": [
      {
        "field": "title",
        "message": "Title is required and must be between 2 and 80 characters."
      }
    ],
    "correlationId": "hl-req-7f3b8e1a-4c2d-4819-bf93-6a9b4d8c11e2"
  }
}
```

### HTTP Status Code Usage:
* `200 OK`: Successful resource retrieval, update, or idempotent state toggle.
* `201 Created`: Successful creation of a new resource (user, habit, note, program).
* `204 No Content`: Successful deletion / removal with empty body.
* `400 Bad Request`: Malformed JSON or invalid query parameter formats.
* `401 Unauthorized`: Request missing valid authentication token.
* `403 Forbidden`: Authenticated user lacks permission (e.g., participant accessing manager routes, or modifying another user's habits).
* `404 Not Found`: Target resource does not exist.
* `409 Conflict`: Unique constraint violation (e.g., registering an email that already exists).
* `422 Unprocessable Entity`: Business logic or validation rule failure (e.g. invalid habit color).
* `500 Internal Server Error`: Generic safe server error without leaking stack traces.
* `503 Service Unavailable`: Cloud readiness probe failure (database connectivity failure).

---

## 3. Endpoints

### 3.1. System & Cloud Readiness Probes

#### `GET /api/health`
* **Purpose**: Uptime check for cloud platform and smoke tests.
* **Access**: Public.
* **Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "HabitLess API",
  "timestamp": "2026-11-13T07:00:00.000Z"
}
```

#### `GET /api/ready`
* **Purpose**: Verifies database connectivity (executes `SELECT 1`).
* **Access**: Public.
* **Response `200 OK`**:
```json
{
  "status": "ready",
  "db": "connected"
}
```
* **Error Response `503 Service Unavailable`**:
```json
{
  "status": "not_ready",
  "error": "Database connection refused"
}
```

---

### 3.2. Authentication & User Profile (Feature 1)

#### `POST /api/auth/register`
* **Purpose**: Register a new user account as `PARTICIPANT` or `PROGRAM_MANAGER` (`HabitLess App Design`, pp. 1, 4).
* **Access**: Public.
* **Request Body**:
```json
{
  "email": "alex.rivera@example.com",
  "password": "SecurePassword123!",
  "fullName": "Alex Rivera",
  "role": "PARTICIPANT"
}
```
* **Validation Rules**:
  * `email`: required, valid email format.
  * `password`: required, minimum 8 characters.
  * `fullName`: required string, length 2–80 characters.
  * `role`: required enum: `PARTICIPANT`, `PROGRAM_MANAGER`.
* **Response `201 Created`**:
```json
{
  "user": {
    "id": 10,
    "email": "alex.rivera@example.com",
    "fullName": "Alex Rivera",
    "role": "PARTICIPANT",
    "isActive": true,
    "createdAt": "2026-11-13T07:05:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Client Post-Auth Redirection**:
  * Role `PARTICIPANT`: Navigates to `/calendar` (Habit Calendar).
  * Role `PROGRAM_MANAGER`: Navigates to `/manager`.
* **Error Responses**:
  * `409 Conflict`: Email address is already registered.
  * `422 Unprocessable Entity`: Validation failure on fields.

#### `POST /api/auth/login`
* **Purpose**: Authenticate user credentials and establish session (`HabitLess App Design`, p. 4).
* **Access**: Public.
* **Request Body**:
```json
{
  "email": "alex.rivera@example.com",
  "password": "SecurePassword123!"
}
```
* **Response `200 OK`**:
```json
{
  "user": {
    "id": 10,
    "email": "alex.rivera@example.com",
    "fullName": "Alex Rivera",
    "role": "PARTICIPANT",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Client Post-Auth Redirection**:
  * Role `PARTICIPANT`: Navigates to `/calendar` (Habit Calendar).
  * Role `PROGRAM_MANAGER`: Navigates to `/manager`.
* **Error Responses**:
  * `401 Unauthorized`: Invalid email or password.

#### `POST /api/auth/logout`
* **Purpose**: Terminate active session and clear token.
* **Access**: Authenticated.
* **Response `200 OK`**:
```json
{
  "message": "Logged out successfully"
}
```

#### `GET /api/auth/me`
* **Purpose**: Fetch profile of currently authenticated user.
* **Access**: Authenticated.
* **Response `200 OK`**:
```json
{
  "id": 10,
  "email": "alex.rivera@example.com",
  "fullName": "Alex Rivera",
  "role": "PARTICIPANT",
  "isActive": true
}
```

---

### 3.3. Habit Management (Feature 2 & 3)

#### `GET /api/habits`
* **Purpose**: List all habits belonging to the authenticated participant.
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**:
  * `status` (optional string): `active` (default) or `archived`.
* **Response `200 OK`**:
```json
[
  {
    "id": 101,
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
    "monthlyCompletedCount": 19
  },
  {
    "id": 102,
    "title": "Exercise",
    "description": "Daily workout or run",
    "colorHex": "#448aff",
    "frequency": "DAILY",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": null,
    "targetCount": 20,
    "isActive": true,
    "programId": null,
    "monthlyCompletedCount": 14
  }
]
```

#### `POST /api/habits`
* **Purpose**: Create a new custom habit with fixed habit color (`HabitLess App Design`, pp. 1, 4).
* **Access**: Authenticated (`PARTICIPANT`).
* **Request Body**:
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
  * `title`: required string, length 2–80 chars after trimming.
  * `description`: optional string, max 500 chars.
  * `colorHex`: required string, **must strictly match one of the 8 fixed habit palette hexes**:
    * `#448aff` (Blue Energy)
    * `#1565c0` (Ocean Deep)
    * `#009688` (Verdigris)
    * `#8bc34a` (Yellow Green)
    * `#ffc107` (Amber Gold)
    * `#ff9800` (Amber Glow)
    * `#f44336` (Cinnabar)
    * `#ad1457` (Cherry Rose)
    *(or their 8-character `#RRGGBBff` equivalents)*
  * `frequency`: required enum: `DAILY`, `WEEKDAYS`, `THREE_TIMES_WEEKLY`, `WEEKLY`, `MONTHLY`, `CUSTOM_DAYS`.
  * `startDate`: required ISO date string.
  * `endDate`: optional ISO date string. If supplied, must be &ge; `startDate`.
  * `targetCount`: optional integer, default `20`, minimum `1`, maximum `31`.
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
  "createdAt": "2026-11-13T07:10:00.000Z"
}
```
* **Error Response `422 Unprocessable Entity`**:
```json
{
  "error": {
    "code": "INVALID_HABIT_COLOR",
    "message": "Color must be one of the 8 fixed habit palette colors: #448aff (Blue Energy), #1565c0 (Ocean Deep), #009688 (Verdigris), #8bc34a (Yellow Green), #ffc107 (Amber Gold), #ff9800 (Amber Glow), #f44336 (Cinnabar), #ad1457 (Cherry Rose)."
  }
}
```

#### `GET /api/habits/:id`
* **Purpose**: Retrieve details of an owned habit.
* **Access**: Authenticated (`PARTICIPANT` owner).
* **Response `200 OK`**: Habit detail DTO.

#### `PUT /api/habits/:id`
* **Purpose**: Update habit details (name, description, color, frequency, dates, targetCount) directly from the Daily Habit Tracker Calendar (`HabitLess App Design`, pp. 1, 3).
* **Access**: Authenticated (`PARTICIPANT` owner).
* **Response `200 OK`**: Updated habit DTO.

#### `DELETE /api/habits/:id`
* **Purpose**: Soft-delete / archive habit.
* **Access**: Authenticated (`PARTICIPANT` owner).
* **Response `204 No Content`**.

---

### 3.4. Tracking, Checklist & Calendar Desktop (Feature 2 & 3)

> **Participant Page Architecture & API Mapping**:  
> Participants interact primarily with the unified **Habit Calendar** (`/calendar`). Daily habits and the monthly calendar desktop matrix are **not separate pages**.  
> - `GET /api/tracking/today` powers the left side panel of daily habits scheduled for the active date, as well as the initial state of the active day's illuminated column.  
> - `POST /api/tracking/log` handles check/uncheck toggles when the user clicks habit cells in the active illuminated date column.  
> - `GET /api/tracking/calendar` provides the full 1–31 month matrix and goal achievement counts for the desktop calendar grid.  
> - **Note on Dashboard (`/dashboard`)**: The participant dashboard view is under construction in Sprint 1 MVP. Navigating to `/dashboard` or clicking the "Dashboard" nav link triggers a client-side notification popup (*"Dashboard is still under construction"*); no dedicated `/api/dashboard` endpoint is required for Sprint 1.

#### `GET /api/tracking/today`
* **Purpose**: Retrieve checklist of today's assigned habits and activities (`HabitLess App Design`, pp. 1, 4). Powers the side list of daily habits and the initial state of the illuminated active column on the Habit Calendar (`/calendar`).
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**:
  * `date` (optional string, `YYYY-MM-DD`, defaults to current server date).
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
      "colorHex": "#ff9800",
      "frequency": "DAILY",
      "isCompleted": true,
      "logId": 501
    },
    {
      "habitId": 102,
      "title": "Exercise",
      "colorHex": "#448aff",
      "frequency": "DAILY",
      "isCompleted": false,
      "logId": null
    }
  ]
}
```

#### `POST /api/tracking/log`
* **Purpose**: Idempotently toggle habit completion for a specific calendar date (typically triggered by clicking a cell in the illuminated active day column on the Habit Calendar `/calendar`) (`HabitLess App Design`, pp. 1, 3, 4).
* **Access**: Authenticated (`PARTICIPANT`).
* **Request Body**:
```json
{
  "habitId": 102,
  "date": "2026-11-13",
  "completed": true
}
```
* **Validation Rules**:
  * `habitId`: required integer, must belong to authenticated user.
  * `date`: required string in format `YYYY-MM-DD`. Cannot be a future date beyond tomorrow.
  * `completed`: required boolean. If `true`, saves completion; if `false`, deletes completion record.
* **Response `200 OK`**:
```json
{
  "habitId": 102,
  "date": "2026-11-13",
  "completed": true,
  "updatedAt": "2026-11-13T07:15:00.000Z"
}
```

#### `GET /api/tracking/calendar`
* **Purpose**: Retrieve the monthly habit matrix (habits, days 1–31 with day-of-week initials, completion checkmarks in habit colors, target count vs achieved count) matching `HabitLess App Design`, p. 3. Used to render the unified Habit Calendar desktop (`/calendar`).
* **Access**: Authenticated (`PARTICIPANT`).
* **Query Parameters**:
  * `month` (required integer, 1–12): e.g., `3`.
  * `year` (required integer, 4-digit): e.g., `2021` or `2026`.
* **Response `200 OK`**:
```json
{
  "month": 3,
  "year": 2021,
  "daysInMonth": 31,
  "dayInitials": ["M", "T", "W", "T", "F", "S", "S"],
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

#### `GET /api/tracking/goals`
* **Purpose**: Retrieve goals tracker overview (monthly target count vs. achieved count per habit) (`HabitLess App Design`, pp. 1, 3, 4).
* **Access**: Authenticated (`PARTICIPANT`).
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

#### `GET /api/tracking/notes`
* **Purpose**: List reflection notes for the calendar view (`HabitLess App Design`, p. 3).
* **Access**: Authenticated (`PARTICIPANT`).
* **Response `200 OK`**:
```json
[
  {
    "id": 1,
    "noteDate": "2021-03-18",
    "timestamp": "2021-03-18T21:00:00.000Z",
    "content": "I gotta make sure I don't let my alcohol intake get regular again."
  },
  {
    "id": 2,
    "noteDate": "2021-03-17",
    "timestamp": "2021-03-17T21:00:00.000Z",
    "content": "Great energy after morning meditation."
  }
]
```

#### `POST /api/tracking/notes`
* **Purpose**: Create a new reflection note via the `+ New Note` action located below the calendar (`HabitLess App Design`, p. 3).
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
  * `noteDate`: required string `YYYY-MM-DD`.
  * `content`: required string, length 1–1000 characters.
  * `habitId`: optional integer.
* **Response `201 Created`**: Created note DTO.

---

### 3.5. Program Manager Challenge Creation & Deployment (Feature 4)

#### `GET /api/manager/programs`
* **Purpose**: List challenge programs created by the authenticated Program Manager.
* **Access**: Authenticated (`PROGRAM_MANAGER`).
* **Response `200 OK`**:
```json
[
  {
    "id": 5,
    "title": "30-Day Wellness Challenge",
    "description": "Establish daily healthy routines",
    "category": "Wellness",
    "startDate": "2026-12-01T00:00:00.000Z",
    "endDate": "2026-12-30T00:00:00.000Z",
    "status": "PUBLISHED",
    "activitiesCount": 3,
    "inviteUrl": "/challenges/5"
  }
]
```

#### `POST /api/manager/programs`
* **Purpose**: Create a new challenge program with defined habits/activities (`HabitLess App Design`, pp. 1, 5).
* **Access**: Authenticated (`PROGRAM_MANAGER`).
* **Request Body**:
```json
{
  "title": "30-Day Wellness Challenge",
  "description": "Establish daily healthy routines",
  "category": "Wellness",
  "startDate": "2026-12-01T00:00:00.000Z",
  "endDate": "2026-12-30T00:00:00.000Z",
  "activities": [
    {
      "title": "Daily Hydration (2L)",
      "description": "Drink at least 2 liters of water daily",
      "frequency": "DAILY",
      "targetCount": 1
    },
    {
      "title": "Morning Meditation",
      "description": "10 minutes mindful breathing",
      "frequency": "DAILY",
      "targetCount": 1
    },
    {
      "title": "Cardio Exercise",
      "description": "Running or fast walking",
      "frequency": "THREE_TIMES_WEEKLY",
      "targetCount": 3
    }
  ]
}
```
* **Validation Rules**:
  * `title`: required string, length 3–100 chars.
  * `category`: required string.
  * `startDate` & `endDate`: required ISO dates, `endDate >= startDate`.
  * `activities`: non-empty array of activity objects (min 1 activity).
* **Response `201 Created`**: Program DTO with status `DRAFT`.

#### `PUT /api/manager/programs/:id/deploy`
* **Purpose**: Deploy/publish challenge program to the web to invite participants (`HabitLess App Design`, pp. 1, 5).
* **Access**: Authenticated (`PROGRAM_MANAGER` owner).
* **Response `200 OK`**:
```json
{
  "id": 5,
  "title": "30-Day Wellness Challenge",
  "status": "PUBLISHED",
  "deployedAt": "2026-11-13T07:25:00.000Z",
  "inviteUrl": "/challenges/5"
}
```

---

### 3.6. Web Challenge Invitation & Participant Joining (Feature 4)

> [!NOTE]
> Per `HabitLess App Design`, p. 4, a separate discovery catalog browsing page (`See new challenge packages ... (this is a new page)`) is categorized under **High Priority / High Effort** and deferred to post-Sprint 1. For Sprint 1 MVP, Program Manager deployment creates a direct public/web challenge invitation (`/challenges/:id`) where participants can view and join.

#### `GET /api/challenges/:id`
* **Purpose**: View a deployed challenge's details via its web invite link (`HabitLess App Design`, pp. 1, 5).
* **Access**: Public / Authenticated.
* **Response `200 OK`**:
```json
{
  "id": 5,
  "title": "30-Day Wellness Challenge",
  "description": "Establish daily healthy routines",
  "category": "Wellness",
  "startDate": "2026-12-01T00:00:00.000Z",
  "endDate": "2026-12-30T00:00:00.000Z",
  "activities": [
    {
      "title": "Daily Hydration (2L)",
      "description": "Drink at least 2 liters of water daily",
      "frequency": "DAILY"
    },
    {
      "title": "Morning Meditation",
      "description": "10 minutes mindful breathing",
      "frequency": "DAILY"
    },
    {
      "title": "Cardio Exercise",
      "description": "Running or fast walking",
      "frequency": "THREE_TIMES_WEEKLY"
    }
  ]
}
```

#### `POST /api/challenges/:id/join`
* **Purpose**: Enroll the authenticated participant into the deployed challenge (`HabitLess App Design`, pp. 1, 5).
* **Access**: Authenticated (`PARTICIPANT`).
* **Response `201 Created`**:
```json
{
  "enrollmentId": 42,
  "programId": 5,
  "participantId": 10,
  "enrolledAt": "2026-11-13T07:30:00.000Z",
  "message": "Enrolled in challenge successfully"
}
```
