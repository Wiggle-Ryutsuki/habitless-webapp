# Feature 4 Engineering Contract: Program Manager Challenge Creation & Deployment

**Feature ID**: FEATURE-HL-04  
**Target Branch**: `feature/4-program-challenge`  
**Base Branch**: `staging` (dependent on merged Feature 1 and Feature 2 baseline)  
**Status**: Approved Specification Baseline (Fully Reconciled & Hardened)  
**Version**: 1.1  
**Sprint Alignment**: Sprint 1 (MVP Increment 4 of 4, v1.5 Specifications)  
**Parent Specifications**:  
- [`docs/sprint-01/specification.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/specification.md)  
- [`docs/sprint-01/api-spec.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/api-spec.md)  
- [`docs/sprint-01/ui-spec.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/ui-spec.md)  
- [`docs/sprint-01/tests.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/tests.md)  
- [`docs/sprint-01/_lab5_sec31_habitless.pdf`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/_lab5_sec31_habitless.pdf)  

---

## 1. Purpose, Scope, and Explicit Exclusions

### 1.1. Purpose & Deliverables
Feature 4 delivers the curriculum authoring, lifecycle management, and web distribution capabilities for Program Managers in HabitLess. It implements the complete Program Manager workflow specified in `_lab5_sec31_habitless.pdf` (pp. 1, 5) and the Sprint 1 specification suite.

Feature 4 introduces four interconnected capabilities:

1. **Program Manager Challenge Program Builder (`Screen 5` / `/manager`)**:
   - Program Managers can author multi-week wellness challenges with defined start and end dates (e.g., `"30-Day Wellness Challenge"`), categorized under domains such as `"Wellness"`, `"Fitness"`, or `"Mindfulness"`.
   - Programs begin in `DRAFT` status, allowing ongoing editing of titles, guidelines/descriptions, schedules, and curriculum activities before publishing.
2. **Standardized Activity Curriculum Definition**:
   - Within each challenge program, Program Managers define standardized habits/activities that participants will follow.
   - Each activity specifies a title (e.g., `"Daily Hydration (2L)"`), an optional instruction/description (e.g., `"Drink at least 2 liters of water daily"`), a target frequency (e.g., `DAILY`, `THREE_TIMES_WEEKLY`, `WEEKDAYS`, `WEEKLY`, `MONTHLY`), and a default target count.
3. **Web Challenge Deployment & Shareable Invitation Link Generation**:
   - Program Managers can deploy/publish draft programs to the web (`DRAFT` &rarr; `PUBLISHED`) and archive retired programs (`PUBLISHED` &rarr; `ARCHIVED`).
   - Deployment activates the public web route `/challenges/:id` and generates a persistent, shareable web invitation link.
   - Program Managers can review their authored programs, inspect draft versus published statuses, edit drafts, archive retired challenges, and copy public invitation links directly to the clipboard.
4. **Web Challenge Invitation Landing View & Participant Enrollment (`Screen 6` / `/challenges/:id`)**:
   - A dedicated landing page rendering the public overview of any published challenge program, including title, category badge, date range, guidelines, and curriculum activities.
   - Allows authenticated Participants to inspect the challenge curriculum and join with a single action (`POST /api/challenges/:id/join`), recording an official enrollment (`ProgramEnrollment`) and automatically generating active curriculum `Habit` rows linked via `Habit.programId` for calendar tracking.
   - Unauthenticated visitors are guided to sign in or register before enrolling, while already-enrolled participants receive clear status feedback.

---

### 1.2. Explicit Exclusions (Strict Scope Boundary)

To protect delivery velocity and enforce the approved MVP scope boundaries:

* **Excluded Feature 1 Capabilities (Auth, RBAC, Probes—Assumed Merged)**:
  - User registration (`POST /api/auth/register`), login/session management (`POST /api/auth/login`), profile retrieval (`GET /api/auth/me`), password hashing, JWT HttpOnly cookies, and Cloud health probes (`GET /api/health`, `GET /api/ready`) are assumed complete and merged from `feature/1-auth-roles`.
* **Excluded Feature 2 Capabilities (Habits Baseline & Side Checklist—Assumed Merged)**:
  - Custom habit creation modal (`POST /api/habits`), fixed 8-color habit swatch picker, daily tracking checklist (`/api/tracking/today`, `/api/tracking/log`), and the Dashboard under-construction placeholder (`/dashboard` with notification popup) are assumed complete and merged from `feature/2-habit-checklist`.
* **Excluded Feature 3 Capabilities (Calendar Desktop Grid & Notes—Independent Dependency)**:
  - Full 31-day desktop calendar matrix (`GET /api/tracking/calendar`), in-calendar habit editing modal (`PUT /api/habits/:id`), monthly Goals Tracker column (`GET /api/tracking/goals`), and calendar reflection notes (`DailyNote` model, `GET /api/tracking/notes`, `POST /api/tracking/notes`) are delivered independently in `feature/3-calendar-goals`.
  - *Dependency Rule*: Feature 4 branches from `staging` after Feature 1 and Feature 2 are merged. Feature 4 schemas link optionally to `Habit.programId` without requiring Feature 3 runtime code or Feature 3 `DailyNote` schema models.
* **Excluded Non-MVP & Deferred Capabilities (Post-Sprint 1 per `_lab5_sec31_habitless.pdf`, pp. 4–5)**:
  - **Participant Challenge Discovery Catalog**: Browsing page for uninvited users (`"See new challenge packages ... (this is a new page)"`) is categorized as *High Priority / High Effort* and deferred. In Sprint 1 MVP, challenge access occurs exclusively via direct web invitation links (`/challenges/:id`).
  - **Active Roster Management**: Viewing enrolled participant rosters, tracking individual participant compliance, and removing or deactivating participants are categorized as *High Priority / High Effort* and deferred.
  - **Challenge & Category Popularity Analytics**: Statistical dashboards showing which challenges or categories are most popular are categorized as *High Priority / High Effort* and deferred.
  - **Challenge Popularity Ranking / Public Leaderboard**: Ranked leaderboards and competitive scoring are categorized as *Low Priority / High Effort* and deferred.
  - **Streaks & Highest Streak Counters**: Habit streaks and gamification badges are categorized as *Low Priority / Low Effort* and deferred.
  - **Custom Arbitrary Hex Color Pickers**: Hex inputs outside the 8 fixed habit palette tokens remain strictly forbidden.
  - **Daily Mood Tracker**: Mood rating and mental health tracking calendars are categorized as *Low Priority / High Effort* and deferred.
  - **Automated Email / SMS Reminders**: Notification dispatch pipelines are categorized as *Low Priority / High Effort* and deferred.
  - **One-Click CSV Log Export**: Data export capabilities are categorized as *Low Priority / High Effort* and deferred.
  - **Bug Report Form**: Feedback reporting forms are categorized as *Low Priority / Low Effort* and deferred.

---

## 2. Requirements Traceability Matrix

| Requirement / Rule / AC | Description | Implementation Target in Feature 4 |
| :--- | :--- | :--- |
| **FR-13** | Program Creation & Modification | Program Managers create challenge programs specifying title, description, category, and defined start/end dates (`Screen 5`, `POST /api/manager/programs`, `PUT /api/manager/programs/:id`, `API-12`). |
| **FR-14** | Activity Definition | Program Managers define standardized curriculum activities within a program, specifying titles, descriptions, target frequencies, and target counts (`Screen 5`, `UI-07`, `API-12`). |
| **FR-15** | Web Challenge Deploy & Join | Program Managers publish challenge programs to the web (`PUT /api/manager/programs/:id/deploy`, `API-14`), generating `/challenges/:id` (`Screen 6`); Participants view and join challenges, materializing calendar habits (`POST /api/challenges/:id/join`, `API-15`). |
| **BR-01** | Role Isolation | Endpoints under `/api/manager/*` strictly require role `PROGRAM_MANAGER`. Users with role `PARTICIPANT` receive `403 Forbidden` (`API-13`). Endpoints under `/api/challenges/:id/join` require role `PARTICIPANT`. |
| **BR-04** | Description Constraints | Optional description/guidelines text fields are restricted to a maximum of 500 characters across programs and activities. |
| **BR-05** | Date Range Invariant | `endDate >= startDate`. Single-day challenges (`startDate === endDate`) are valid. Inverted dates (`endDate < startDate`) are rejected with HTTP 422 Unprocessable Entity. |
| **BR-08** | Program Deployment Lifecycle | A challenge program enforces statuses: `DRAFT`, `PUBLISHED`, `ARCHIVED`. Deploying transitions status from `DRAFT` to `PUBLISHED` (`PUT /api/manager/programs/:id/deploy`), activating public `/challenges/:id`. Archiving transitions to `ARCHIVED` (`PUT /api/manager/programs/:id/archive`). |
| **AC-09** | Program Manager Challenge Lifecycle | Program Manager logs in &rarr; creates challenge with standardized activities &rarr; deploys to web &rarr; receives `/challenges/:id` link &rarr; participant visits link, joins challenge, and curriculum habits appear on calendar (`E2E-03`). |

---

## 3. Data Design & Idempotent Seed Requirements

### 3.1. Prisma Schema Evolution (`server/prisma/schema.prisma`)

Feature 4 introduces the `ProgramStatus` enum and three core relational models (`ChallengeProgram`, `ProgramActivity`, and `ProgramEnrollment`), while formalizing foreign keys on `User` and `Habit`.

> [!IMPORTANT]
> **Strict Scope Boundary**: Feature 4 does **not** introduce or reference Feature 3's `DailyNote` model or `HabitLog` modifications. The schema below builds strictly upon merged Feature 1 & 2 foundations:

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

enum ProgramStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id              Int                 @id @default(autoincrement())
  email           String              @unique
  passwordHash    String
  fullName        String
  role            Role                @default(PARTICIPANT)
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  habits          Habit[]
  enrollments     ProgramEnrollment[]
  managedPrograms ChallengeProgram[]  @relation("ManagerPrograms")

  @@map("users")
}

model Habit {
  id          Int           @id @default(autoincrement())
  userId      Int
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?
  colorHex    String        @default("#448aff")
  frequency   FrequencyType @default(DAILY)
  daysOfWeek  Int[]         @default([1, 2, 3, 4, 5, 6, 7]) // ISO-8601: 1=Mon .. 7=Sun
  startDate   DateTime      @default(now())
  endDate     DateTime?
  targetCount Int           @default(20)
  isActive    Boolean       @default(true)
  programId   Int?          // Foreign key linking habit to challenge program
  program     ChallengeProgram? @relation(fields: [programId], references: [id], onDelete: SetNull)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  logs        HabitLog[]

  @@index([userId, isActive])
  @@index([programId])
  @@map("habits")
}

model HabitLog {
  id        Int      @id @default(autoincrement())
  habitId   Int
  habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  logDate   DateTime @db.Date
  completed Boolean  @default(true)
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([habitId, logDate])
  @@index([logDate])
  @@map("habit_logs")
}

model ChallengeProgram {
  id          Int                 @id @default(autoincrement())
  managerId   Int
  manager     User                @relation("ManagerPrograms", fields: [managerId], references: [id], onDelete: Restrict)
  title       String
  description String?
  category    String              // e.g. "Wellness", "Fitness", "Mindfulness"
  startDate   DateTime
  endDate     DateTime
  status      ProgramStatus       @default(DRAFT)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  habits      Habit[]
  activities  ProgramActivity[]
  enrollments ProgramEnrollment[]

  @@index([managerId])
  @@index([status])
  @@index([category])
  @@map("challenge_programs")
}

model ProgramActivity {
  id          Int              @id @default(autoincrement())
  programId   Int
  program     ChallengeProgram @relation(fields: [programId], references: [id], onDelete: Cascade)
  title       String
  description String?
  frequency   FrequencyType    @default(DAILY)
  targetCount Int              @default(1)
  createdAt   DateTime         @default(now())

  @@index([programId])
  @@map("program_activities")
}

model ProgramEnrollment {
  id            Int              @id @default(autoincrement())
  programId     Int
  program       ChallengeProgram @relation(fields: [programId], references: [id], onDelete: Cascade)
  participantId Int
  participant   User             @relation(fields: [participantId], references: [id], onDelete: Cascade)
  enrolledAt    DateTime         @default(now())
  isActive      Boolean          @default(true)

  @@unique([programId, participantId])
  @@index([programId])
  @@index([participantId])
  @@map("program_enrollments")
}
```

---

### 3.2. Relational Invariants & Integrity Constraints

1. **Manager Authorship Isolation**:
   - `ChallengeProgram.managerId` references `User.id`. Foreign key integrity is guarded by `onDelete: Restrict` so a manager account with authored programs cannot be deleted without reassigning or archiving their programs.
   - At the application layer, queries verifying ownership assert `program.managerId === req.user.id`.
2. **Cascade Cleanup for Program Activities & Enrollments**:
   - `ProgramActivity` rows are strictly bound to their parent `ChallengeProgram`. If a draft program is deleted, its activities cascade delete (`onDelete: Cascade`).
   - `ProgramEnrollment` rows cascade delete if the parent challenge program is removed (`onDelete: Cascade`), or if the participating user is permanently deleted.
3. **Preservation of Participant Personal Habits**:
   - When a participant enrolls in a challenge, personal `Habit` rows are generated with `Habit.programId = program.id`. Removing or archiving the challenge program must **never** delete the participant's tracking history or habit logs. `Habit.programId` is configured with `onDelete: SetNull` to preserve participant data.
4. **Idempotent Enrollment Constraint**:
   - `ProgramEnrollment` enforces a unique composite constraint `@@unique([programId, participantId])`. A participant can only have one active enrollment record per challenge program, preventing duplicate join operations.
5. **Program Lifecycle States (`BR-08`)**:
   - `DRAFT`: Program is authorable and editable by the owner manager (`PUT /api/manager/programs/:id`). Hidden from public challenge endpoints.
   - `PUBLISHED`: Program is active and public. The invitation link `/challenges/:id` is enabled for participant enrollment. Content is immutable.
   - `ARCHIVED`: Program is retired (`PUT /api/manager/programs/:id/archive`). No new participant enrollments permitted; `/challenges/:id` returns 404 or 410.

---

### 3.3. Idempotent Seed Requirements (`server/prisma/seed.ts`)

The database seeder executes idempotently using `upsert` and find-or-create patterns, ensuring existing test data remains consistent:

```typescript
// Seed Additions in server/prisma/seed.ts for Feature 4:

// 1. Ensure Demo Program Manager exists
const demoManager = await prisma.user.upsert({
  where: { email: 'manager@habitless.internal' },
  update: {
    fullName: 'Dr. Jordan Wells (Wellness Director)',
    role: Role.PROGRAM_MANAGER,
    isActive: true,
  },
  create: {
    email: 'manager@habitless.internal',
    fullName: 'Dr. Jordan Wells (Wellness Director)',
    role: Role.PROGRAM_MANAGER,
    passwordHash: managerHash,
    isActive: true,
  },
});

// 2. Upsert Published Seed Challenge Program: "30-Day Wellness Challenge"
const seedStartDate = new Date(Date.UTC(2026, 10, 1, 0, 0, 0)); // Nov 1, 2026
const seedEndDate = new Date(Date.UTC(2026, 10, 30, 23, 59, 59));  // Nov 30, 2026

let wellnessChallenge = await prisma.challengeProgram.findFirst({
  where: {
    managerId: demoManager.id,
    title: '30-Day Wellness Challenge',
  },
});

if (wellnessChallenge) {
  wellnessChallenge = await prisma.challengeProgram.update({
    where: { id: wellnessChallenge.id },
    data: {
      category: 'Wellness',
      description: 'Establish foundational daily routines for hydration, mindfulness, and physical movement.',
      startDate: seedStartDate,
      endDate: seedEndDate,
      status: 'PUBLISHED',
    },
  });
} else {
  wellnessChallenge = await prisma.challengeProgram.create({
    data: {
      managerId: demoManager.id,
      title: '30-Day Wellness Challenge',
      category: 'Wellness',
      description: 'Establish foundational daily routines for hydration, mindfulness, and physical movement.',
      startDate: seedStartDate,
      endDate: seedEndDate,
      status: 'PUBLISHED',
    },
  });
}

// 3. Upsert Standardized Activities for "30-Day Wellness Challenge"
const seedActivities = [
  {
    title: 'Daily Hydration (2L)',
    description: 'Drink at least 2 liters of pure water daily.',
    frequency: 'DAILY' as const,
    targetCount: 1,
  },
  {
    title: 'Morning Meditation (10 min)',
    description: '10 minutes of guided mindful breathing.',
    frequency: 'DAILY' as const,
    targetCount: 1,
  },
  {
    title: '30 min Cardio (3x/week)',
    description: 'Brisk walking, jogging, cycling, or swimming.',
    frequency: 'THREE_TIMES_WEEKLY' as const,
    targetCount: 3,
  },
];

for (const act of seedActivities) {
  const existingAct = await prisma.programActivity.findFirst({
    where: {
      programId: wellnessChallenge.id,
      title: act.title,
    },
  });

  if (existingAct) {
    await prisma.programActivity.update({
      where: { id: existingAct.id },
      data: {
        description: act.description,
        frequency: act.frequency,
        targetCount: act.targetCount,
      },
    });
  } else {
    await prisma.programActivity.create({
      data: {
        programId: wellnessChallenge.id,
        title: act.title,
        description: act.description,
        frequency: act.frequency,
        targetCount: act.targetCount,
      },
    });
  }
}
```

---

## 4. API Contract & RBAC Endpoints

All endpoints adhere to the application's standard HTTP envelopes, status codes, and authorization rules.

### 4.1. Standard Error Envelope

Every client error (`4xx`) and server error (`500`) returns the unified JSON error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload failed validation.",
    "fieldErrors": [
      {
        "field": "title",
        "message": "Title is required and must be between 3 and 100 characters."
      }
    ],
    "correlationId": "hl-req-8e2b9c1d-5a1f-4f8a-9e12-3b7c8d9e01f2"
  }
}
```

#### HTTP Status Codes Utilized:
* `200 OK`: Successful resource retrieval, update, or program deployment/archival.
* `201 Created`: Program created in `DRAFT` status or participant enrolled with materialized habits.
* `400 Bad Request`: Malformed JSON or invalid parameter syntax (e.g. non-integer ID `/abc`).
* `401 Unauthorized`: Missing, expired, or invalid session authentication token.
* `403 Forbidden`: Authenticated user lacks required role (`PARTICIPANT` attempting to access `/api/manager/*` or manager attempting to deploy another manager's program).
* `404 Not Found`: Program ID does not exist or challenge is unpublished (`DRAFT`).
* `409 Conflict`: Participant is already enrolled in the challenge (`ALREADY_ENROLLED`).
* `422 Unprocessable Entity`: Business validation failure (e.g., `endDate < startDate`, title length violation, empty activities array, or attempting to edit a published program).
* `500 Internal Server Error`: Unhandled server exception with sanitized error details.

---

### 4.2. List Manager Programs (`GET /api/manager/programs`)

* **Purpose**: List all challenge programs created by the authenticated Program Manager.
* **HTTP Method**: `GET`
* **Path**: `/api/manager/programs`
* **Access Control**: Authenticated (`PROGRAM_MANAGER` only).
* **Response `200 OK`**:
```json
[
  {
    "id": 5,
    "title": "30-Day Wellness Challenge",
    "description": "Establish daily healthy routines",
    "category": "Wellness",
    "startDate": "2026-11-01T00:00:00.000Z",
    "endDate": "2026-11-30T00:00:00.000Z",
    "status": "PUBLISHED",
    "activitiesCount": 3,
    "inviteUrl": "/challenges/5",
    "createdAt": "2026-10-25T12:00:00.000Z",
    "updatedAt": "2026-10-26T14:30:00.000Z"
  },
  {
    "id": 6,
    "title": "Mindful December Primer",
    "description": "Focus and breathing exercises",
    "category": "Mindfulness",
    "startDate": "2026-12-01T00:00:00.000Z",
    "endDate": "2026-12-31T00:00:00.000Z",
    "status": "DRAFT",
    "activitiesCount": 2,
    "inviteUrl": null,
    "createdAt": "2026-11-10T09:00:00.000Z",
    "updatedAt": "2026-11-10T09:00:00.000Z"
  }
]
```
* **Error Responses**:
  - `401 Unauthorized`: User is unauthenticated.
  - `403 Forbidden`: Authenticated user role is `PARTICIPANT`.

---

### 4.3. Create Challenge Program (`POST /api/manager/programs`)

* **Purpose**: Create a new challenge program with defined standardized activities in `DRAFT` status (`FR-13`, `FR-14`).
* **HTTP Method**: `POST`
* **Path**: `/api/manager/programs`
* **Access Control**: Authenticated (`PROGRAM_MANAGER` only).
* **Request Body Schema**:
```json
{
  "title": "30-Day Wellness Challenge",
  "description": "Establish daily healthy routines for hydration, mindfulness, and cardio.",
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
      "title": "Morning Meditation (10 min)",
      "description": "10 minutes mindful breathing",
      "frequency": "DAILY",
      "targetCount": 1
    },
    {
      "title": "30 min Cardio (3x/week)",
      "description": "Running or fast walking",
      "frequency": "THREE_TIMES_WEEKLY",
      "targetCount": 3
    }
  ]
}
```

#### Validation Rules:
* `title`: Required string, trimmed, 3–100 characters. Exactly 3 and 100 characters are valid; < 3 or > 100 characters rejected with `422`.
* `category`: Required string, trimmed, 1–50 characters (e.g. `"Wellness"`, `"Fitness"`, `"Mindfulness"`, `"Nutrition"`, `"Productivity"`, `"Other"`).
* `description`: Optional string, maximum 500 characters (`BR-04`).
* `startDate`: Required valid ISO-8601 date string.
* `endDate`: Required valid ISO-8601 date string; must satisfy `endDate >= startDate` (`BR-05`). Single-day challenges where `startDate === endDate` are explicitly permitted.
* `activities`: Required array with minimum 1 activity element:
  - `title`: Required string, trimmed, 2–80 characters (`BR-03`).
  - `description`: Optional string, maximum 500 characters (`BR-04`).
  - `frequency`: Valid `FrequencyType` enum (`DAILY`, `WEEKDAYS`, `THREE_TIMES_WEEKLY`, `WEEKLY`, `MONTHLY`). Default: `DAILY`.
  - `targetCount`: Optional integer &ge; 1. Default: `1`.

* **Response `201 Created`**:
```json
{
  "id": 5,
  "managerId": 2,
  "title": "30-Day Wellness Challenge",
  "description": "Establish daily healthy routines for hydration, mindfulness, and cardio.",
  "category": "Wellness",
  "startDate": "2026-12-01T00:00:00.000Z",
  "endDate": "2026-12-30T00:00:00.000Z",
  "status": "DRAFT",
  "activities": [
    {
      "id": 12,
      "programId": 5,
      "title": "Daily Hydration (2L)",
      "description": "Drink at least 2 liters of water daily",
      "frequency": "DAILY",
      "targetCount": 1,
      "createdAt": "2026-11-14T08:00:00.000Z"
    },
    {
      "id": 13,
      "programId": 5,
      "title": "Morning Meditation (10 min)",
      "description": "10 minutes mindful breathing",
      "frequency": "DAILY",
      "targetCount": 1,
      "createdAt": "2026-11-14T08:00:00.000Z"
    },
    {
      "id": 14,
      "programId": 5,
      "title": "30 min Cardio (3x/week)",
      "description": "Running or fast walking",
      "frequency": "THREE_TIMES_WEEKLY",
      "targetCount": 3,
      "createdAt": "2026-11-14T08:00:00.000Z"
    }
  ],
  "inviteUrl": null,
  "createdAt": "2026-11-14T08:00:00.000Z",
  "updatedAt": "2026-11-14T08:00:00.000Z"
}
```
* **Error Responses**:
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: Authenticated user is `PARTICIPANT`.
  - `422 Unprocessable Entity`: Validation failure (e.g. `title` < 3 or > 100 characters, empty `activities` array, or `endDate < startDate`).

---

### 4.4. Get Single Manager Program (`GET /api/manager/programs/:id`)

* **Purpose**: Fetch a specific challenge program by ID for the manager authoring interface (powers editing and manager preview in any lifecycle state).
* **HTTP Method**: `GET`
* **Path**: `/api/manager/programs/:id`
* **Access Control**: Authenticated (`PROGRAM_MANAGER` owner only).
* **Response `200 OK`**: Program DTO with activities array and status (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
* **Error Responses**:
  - `401 Unauthorized`: Missing authentication.
  - `403 Forbidden`: User is a participant, or manager is not the owner of program `:id`.
  - `404 Not Found`: Program `:id` does not exist.

---

### 4.5. Update Draft Program (`PUT /api/manager/programs/:id`)

* **Purpose**: Modify an existing challenge program and its standardized activities prior to web deployment (`FR-13`, `FR-14`).
* **HTTP Method**: `PUT`
* **Path**: `/api/manager/programs/:id`
* **Access Control**: Authenticated (`PROGRAM_MANAGER` owner only).
* **State Invariants**:
  - Allowed **only** while program `status === "DRAFT"`.
  - Attempting to update a program in `PUBLISHED` or `ARCHIVED` status returns `422 Unprocessable Entity` with error code `PROGRAM_NOT_EDITABLE` (`"Published or archived programs cannot be modified"`).
* **Request Body**: Identical schema and validation rules to `POST /api/manager/programs`.
* **Response `200 OK`**: Updated Program DTO with status `DRAFT`.
* **Error Responses**:
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: Manager is not the owner of program `:id`.
  - `404 Not Found`: Program `:id` does not exist.
  - `422 Unprocessable Entity`: Validation failure or program is already published/archived.

---

### 4.6. Deploy Challenge Program to Web (`PUT /api/manager/programs/:id/deploy`)

* **Purpose**: Deploy/publish a draft challenge program to the web (`FR-15`, `BR-08`, `AC-09`). Transitions program status from `DRAFT` to `PUBLISHED` and activates the shareable public web invitation link `/challenges/:id`.
* **HTTP Method**: `PUT`
* **Path**: `/api/manager/programs/:id/deploy`
* **Access Control**: Authenticated (`PROGRAM_MANAGER` owner only).
* **Ownership & State Invariants**:
  - The program must exist (`404 Not Found` if missing).
  - The authenticated manager must own the program (`program.managerId === req.user.id`). Attempting to deploy another manager's program returns `403 Forbidden`.
  - Deploying a program already in `PUBLISHED` status is idempotent and returns `200 OK`.
  - Deploying an `ARCHIVED` program is rejected with `422 Unprocessable Entity` (`PROGRAM_ARCHIVED`).
* **Response `200 OK`**:
```json
{
  "id": 5,
  "title": "30-Day Wellness Challenge",
  "status": "PUBLISHED",
  "deployedAt": "2026-11-14T08:15:00.000Z",
  "inviteUrl": "/challenges/5"
}
```
* **Error Responses**:
  - `401 Unauthorized`: Missing authentication.
  - `403 Forbidden`: Non-manager role or manager is not the owner of program `:id`.
  - `404 Not Found`: Program `:id` does not exist.
  - `422 Unprocessable Entity`: Program is archived.

---

### 4.7. Archive Challenge Program (`PUT /api/manager/programs/:id/archive`)

* **Purpose**: Retire a published or draft challenge program (**BR-08**).
* **HTTP Method**: `PUT`
* **Path**: `/api/manager/programs/:id/archive`
* **Access Control**: Authenticated (`PROGRAM_MANAGER` owner only).
* **State Transition**: Transitions program status to `ARCHIVED`. Sets `updatedAt`.
* **Response `200 OK`**:
```json
{
  "id": 5,
  "title": "30-Day Wellness Challenge",
  "status": "ARCHIVED",
  "archivedAt": "2026-11-14T08:45:00.000Z"
}
```
* **Error Responses**:
  - `401 Unauthorized`: Missing authentication.
  - `403 Forbidden`: Manager is not the owner of program `:id`.
  - `404 Not Found`: Program `:id` does not exist.

---

### 4.8. Get Web Challenge Details (`GET /api/challenges/:id`)

* **Purpose**: View a deployed challenge's curriculum and metadata via its web invitation link (`FR-15`). Powers the public landing view for prospective participants.
* **HTTP Method**: `GET`
* **Path**: `/api/challenges/:id`
* **Access Control**: Public / Authenticated.
* **Strict Visibility Rule**:
  - The endpoint enforces `status === "PUBLISHED"`.
  - If program does not exist, or has `status === "DRAFT"`, or has `status === "ARCHIVED"`, the endpoint **always returns `404 Not Found`** (`CHALLENGE_NOT_FOUND`).
  - This guarantees that unreleased curricula and internal manager notes are never disclosed on public consumer routes.
* **Response `200 OK`**:
```json
{
  "id": 5,
  "title": "30-Day Wellness Challenge",
  "description": "Establish daily healthy routines for hydration, mindfulness, and cardio.",
  "category": "Wellness",
  "startDate": "2026-12-01T00:00:00.000Z",
  "endDate": "2026-12-30T00:00:00.000Z",
  "status": "PUBLISHED",
  "manager": {
    "fullName": "Dr. Jordan Wells (Wellness Director)"
  },
  "activities": [
    {
      "id": 12,
      "title": "Daily Hydration (2L)",
      "description": "Drink at least 2 liters of water daily",
      "frequency": "DAILY",
      "targetCount": 1
    },
    {
      "id": 13,
      "title": "Morning Meditation (10 min)",
      "description": "10 minutes mindful breathing",
      "frequency": "DAILY",
      "targetCount": 1
    },
    {
      "id": 14,
      "title": "30 min Cardio (3x/week)",
      "description": "Running or fast walking",
      "frequency": "THREE_TIMES_WEEKLY",
      "targetCount": 3
    }
  ]
}
```
* **Error Responses**:
  - `404 Not Found`: Program ID does not exist, or challenge is in `DRAFT` or `ARCHIVED` status.

---

### 4.9. Join Challenge Program (`POST /api/challenges/:id/join`)

* **Purpose**: Enroll the authenticated participant into the published challenge program and automatically materialize active calendar habits (`FR-15`, `AC-09`).
* **HTTP Method**: `POST`
* **Path**: `/api/challenges/:id/join`
* **Access Control**: Authenticated (`PARTICIPANT` only).
* **Path Parameters**:
  - `id`: Integer challenge program ID.
* **Prerequisites & Guard Conditions**:
  - Challenge program must exist and have `status === "PUBLISHED"`. If challenge does not exist or is in `DRAFT` / `ARCHIVED` status, returns `404 Not Found`.
  - User must have role `PARTICIPANT`. If a `PROGRAM_MANAGER` invokes this route, returns `403 Forbidden` (`MANAGERS_CANNOT_JOIN`).
  - **Duplicate Enrollment Guard**: If `ProgramEnrollment` already exists for `[programId, participantId]`, returns `409 Conflict` with error code `ALREADY_ENROLLED` and message `"Participant is already enrolled in this challenge"`.

#### Automated Personal Habit Materialization Transaction:
Upon join, the backend executes an atomic database transaction (`prisma.$transaction`):
1. Creates `ProgramEnrollment` for `(programId, participantId)`.
2. For each `ProgramActivity` in the challenge program, generates an active personal `Habit` record for the participant:
   - `userId`: `req.user.id`
   - `programId`: `challenge.id`
   - `title`: `activity.title` (2–80 chars per `BR-03`)
   - `description`: `activity.description` (&le; 500 chars per `BR-04`)
   - `colorHex`: assigned from the 8 fixed habit palette tokens (defaults to `#448aff`, or assigned sequentially from the fixed palette: `["#448aff", "#1565c0", "#009688", "#8bc34a", "#ffc107", "#ff9800", "#f44336", "#ad1457"]` per `BR-02`)
   - `frequency`: `activity.frequency`
   - `daysOfWeek`: mapped from `activity.frequency`:
     - `DAILY` &rarr; `[1, 2, 3, 4, 5, 6, 7]`
     - `WEEKDAYS` &rarr; `[1, 2, 3, 4, 5]`
     - `THREE_TIMES_WEEKLY` &rarr; `[1, 3, 5]`
     - `WEEKLY` &rarr; `[1]`
     - `MONTHLY` &rarr; `[1]`
   - `startDate`: the later of `challenge.startDate` or current date (normalized to UTC midnight)
   - `endDate`: `challenge.endDate`
   - `targetCount`: monthly target count calculated from frequency (e.g., `DAILY` &rarr; `20`, `WEEKDAYS` &rarr; `20`, `THREE_TIMES_WEEKLY` &rarr; `12`, `WEEKLY` &rarr; `4`, clamped between 1 and 31)
   - `isActive`: `true`

* **Response `201 Created`**:
```json
{
  "enrollmentId": 42,
  "programId": 5,
  "participantId": 10,
  "enrolledAt": "2026-11-14T08:30:00.000Z",
  "habitsCreatedCount": 3,
  "message": "Enrolled in challenge successfully and curriculum habits added to calendar"
}
```
* **Error Responses**:
  - `401 Unauthorized`: Visitor is not signed in.
  - `403 Forbidden`: Authenticated user is a `PROGRAM_MANAGER`.
  - `404 Not Found`: Program does not exist or is not `PUBLISHED`.
  - `409 Conflict`: Participant has already enrolled in this challenge (`ALREADY_ENROLLED`).

---

### 4.10. RBAC & Status Guard Summary Table

| Endpoint | Method | Role Allowed | Program Status Allowed | Ownership Check Required? | Non-Owner / Guard Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/manager/programs` | `GET` | `PROGRAM_MANAGER` | Any (`DRAFT`, `PUBLISHED`, `ARCHIVED`) | Scoped to manager | Lists only manager's own programs |
| `/api/manager/programs` | `POST` | `PROGRAM_MANAGER` | Creates `DRAFT` | Scoped to manager | N/A |
| `/api/manager/programs/:id` | `GET` | `PROGRAM_MANAGER` | Any (`DRAFT`, `PUBLISHED`, `ARCHIVED`) | Yes (`managerId === req.user.id`) | `403 Forbidden` or `404 Not Found` |
| `/api/manager/programs/:id` | `PUT` | `PROGRAM_MANAGER` | `DRAFT` only | Yes (`managerId === req.user.id`) | `422` if Published; `403` if not owner |
| `/api/manager/programs/:id/deploy` | `PUT` | `PROGRAM_MANAGER` | `DRAFT` (or `PUBLISHED` idempotent) | Yes (`managerId === req.user.id`) | `403 Forbidden` or `404 Not Found` |
| `/api/manager/programs/:id/archive`| `PUT` | `PROGRAM_MANAGER` | `DRAFT` or `PUBLISHED` | Yes (`managerId === req.user.id`) | `403 Forbidden` or `404 Not Found` |
| `/api/challenges/:id` | `GET` | Public / Any | `PUBLISHED` only | No | `404 Not Found` if draft or archived |
| `/api/challenges/:id/join` | `POST` | `PARTICIPANT` | `PUBLISHED` only | Must not be existing enrollment | `403` if PM; `404` if Draft; `409` if duplicate |

---

## 5. UI Specification & Visual Design Tokens

All Feature 4 user interfaces strictly observe the visual design tokens and color decoupling rules specified in `_lab5_sec31_habitless.pdf` (p. 2) and `docs/sprint-01/ui-spec.md`.

### 5.1. Color Systems & Design Tokens

HabitLess decouples the **Website Theme Palette** (application shell, headers, panels, cards, navigation) from the **Habit Colors Palette** (the 8 fixed swatches for personal habits).

#### Website Theme Palette Tokens:
* `--walnut: #724319` (Headers, active navigation items, primary buttons, text headings).
* `--light-coral: #d88180` (Secondary buttons, draft status badges, activity remove icons).
* `--powder-blush: #f7b1b0` (App canvas accent, section dividers, card background tint).
* `--papaya-whip: #feeac7` (Card borders, outer container backgrounds, subtle highlights).
* `--golden-sand: #cad182` (Published status badges, successful join indicators, accents).

#### Semantic Color Tokens:
* `--color-surface: #ffffff` (Modal dialogs, cards, form input backgrounds).
* `--color-text-main: #724319` (High-contrast Walnut text, ratio > 7:1 against light surfaces).
* `--color-text-muted: #8d7058` (Instructional labels, field placeholders, timestamps).
* `--color-border-subtle: #feeac7` (Dividers, table outlines, form input borders).
* `--color-error: #c62828` (Validation error messages, red asterisks `*`).
* `--color-error-bg: #ffebee` (Error alert banners).

---

### 5.2. Program Manager Application Shell

The Program Manager application shell provides clear role identification, persistent navigation, and session control:

* **Top Navigation Bar**:
  * **Brand**: `HabitLess` logo rendered in bold Walnut (`#724319`).
  * **Role Badge**: Dedicated pill reading `Program Manager` styled in `--golden-sand` (`#cad182`) with dark Walnut text.
  * **Navigation Links**:
    - `[ Programs ]`: Active view displaying the manager's program list and builder (`/manager`).
    - `[ + Create Challenge ]`: Shortcut button opening or focusing the challenge builder form.
  * **Manager Profile Display**: Displays authenticated manager's full name (e.g., `Dr. Jordan Wells (Wellness Director)`) and email (`manager@habitless.internal`).
  * **Log Out Action**: `[ Log Out ]` button executing `POST /api/auth/logout` and redirecting to `/login`.

---

### 5.3. Screen 5: Program Manager Challenge Program Builder & Web Deploy (`/manager`)

* **Path**: `/manager`
* **Access Control**: Role `PROGRAM_MANAGER` required. If an unauthenticated user or `PARTICIPANT` accesses this path, the client redirects to `/login` or `/calendar`.
* **Layout Structure**: Responsive 2-section layout featuring the **Managed Programs List** and the **Challenge Builder Form**.

```
+----------------------------------------------------------------------------------------------------+
| HabitLess   [ Programs ]  [ + Create Challenge ]    Dr. Jordan Wells (Program Manager)  [ Log Out ]|
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  MY MANAGED CHALLENGES                                      CHALLENGE PROGRAM BUILDER              |
|  +-------------------------------------------------------+  +-----------------------------------+  |
|  | 30-Day Wellness Challenge             [ PUBLISHED ]   |  | Program Title *                   |  |
|  | Category: Wellness | Nov 01, 2026 – Nov 30, 2026       |  | [ 30-Day Wellness Challenge     ] |  |
|  | 3 Curriculum Activities                               |  |                                   |  |
|  | Public Link: /challenges/5    [ Copy Link ]           |  | Category *                        |  |
|  | [ Archive ]                                           |  | [ Wellness                     v] |  |
|  +-------------------------------------------------------+  |                                   |  |
|  | Mindful December Primer               [ DRAFT ]       |  | Description                       |  |
|  | Category: Mindfulness | Dec 01, 2026 – Dec 31, 2026   |  | [ Establish healthy habits...   ] |  |
|  | 2 Curriculum Activities                               |  |                                   |  |
|  | [ Edit Draft ]  [ Deploy to Web ]                     |  | Start Date *         End Date *   |  |
|  +-------------------------------------------------------+  | [ 2026-12-01 ]       [ 2026-12-30]|  |
|                                                             |                                   |  |
|                                                             | CURRICULUM ACTIVITIES (Min 1)     |  |
|                                                             | +-------------------------------+ |  |
|                                                             | | 1. Daily Hydration (2L)   [🗑️]| |  |
|                                                             | |    Freq: Daily | Target: 1    | |  |
|                                                             | +-------------------------------+ |  |
|                                                             | | 2. Morning Meditation     [🗑️]| |  |
|                                                             | |    Freq: Daily | Target: 1    | |  |
|                                                             | +-------------------------------+ |  |
|                                                             | [ + Add Activity ]                |  |
|                                                             |                                   |  |
|                                                             | [ Save Draft ]  [ Deploy to Web ] |  |
|                                                             +-----------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Component Specifications:

1. **Managed Programs List**:
   - Renders each challenge program authored by the authenticated manager.
   - **Card Elements**:
     - Program Title (18px, bold Walnut `#724319`).
     - Category Pill (e.g., `"Wellness"`, `"Fitness"`, `"Mindfulness"`).
     - Date Range (e.g., `Nov 01, 2026 – Nov 30, 2026`).
     - Status Badge:
       - `DRAFT`: Styled in Light Coral (`#d88180`) with white text.
       - `PUBLISHED`: Styled in Golden Sand (`#cad182`) with dark Walnut text.
       - `ARCHIVED`: Styled in muted grey (`#9e9e9e`) with white text.
     - Activities Count (e.g., `3 activities defined`).
   - **Card Actions**:
     - If `DRAFT`:
       - `[ Edit Draft ]`: Loads program into builder form for updating via `PUT /api/manager/programs/:id`.
       - `[ Deploy to Web ]`: Primary button (Solid Walnut `#724319`). Invokes `PUT /api/manager/programs/:id/deploy`, immediately updating the status badge to `PUBLISHED` and generating the invitation link.
     - If `PUBLISHED`:
       - Public link display (`/challenges/:id`) with `[ Copy Link ]` action button (copies absolute URL to clipboard with success toast notification).
       - `[ Archive ]`: Secondary button invoking `PUT /api/manager/programs/:id/archive`.

2. **Challenge Builder Form**:
   - **Program Title (`*`)**: Text input, 3–100 characters, required. Red asterisk indicator.
   - **Category (`*`)**: Dropdown selector with options (`Wellness`, `Fitness`, `Mindfulness`, `Nutrition`, `Productivity`, `Other`). Required.
   - **Description**: Multiline text area, optional, maximum 500 characters (`BR-04`). Character counter (`0 / 500`).
   - **Start Date (`*`) & End Date (`*`)**: Side-by-side date inputs. Enforces `endDate >= startDate` (`BR-05`). Single-day challenges (`startDate === endDate`) are valid.
   - **Dynamic Curriculum Activities Section**:
     - Lists all defined activities for the challenge.
     - `[ + Add Activity ]` button appending a new editable activity row.
     - **Activity Row Fields**:
       - Title (`*`): Text input, 2–80 characters (`BR-03`).
       - Description: Optional text input, max 500 characters (`BR-04`).
       - Target Frequency: Dropdown (`Daily`, `3x/week`, `Weekdays only`, `Weekly`, `Monthly`) mapping to `FrequencyType`.
       - Target Count: Numeric stepper/input, minimum 1.
       - Remove Row Action: Trashcan icon button (`🗑️` / `aria-label="Remove activity"`). Disallowed if only 1 activity remains (guarantees minimum 1 activity invariant).
   - **Form Actions & Client Mutation Orchestration**:
     - `[ Save Draft ]`:
       - If editing new challenge: submits `POST /api/manager/programs`.
       - If editing existing draft: submits `PUT /api/manager/programs/:id`.
       - Upon success, refreshes programs list and resets form.
     - `[ Deploy to Web ]`:
       - Orchestrated mutation: if form is currently authoring a new challenge, the client first submits `POST /api/manager/programs` to create the draft, captures the resulting ID, and immediately invokes `PUT /api/manager/programs/:id/deploy`.
       - Displays success toast notification and renders the copyable `/challenges/:id` invite URL.

---

### 5.4. Screen 6: Web Challenge Invitation Landing Page (`/challenges/:id`)

* **Path**: `/challenges/:id`
* **Access Control**: Public / Authenticated.
* **Layout Structure**: Centered, high-fidelity card container (max-width: 720px) on Papaya Whip canvas (`#feeac7`).

```
+--------------------------------------------------------------------------+
| HabitLess                                            [ Sign In / Join ]  |
+--------------------------------------------------------------------------+
|                                                                          |
|       +----------------------------------------------------------+       |
|       | CHALLENGE INVITATION                                     |       |
|       |                                                          |       |
|       | 30-Day Wellness Challenge                [ Wellness ]    |       |
|       | Organized by Dr. Jordan Wells (Wellness Director)        |       |
|       |                                                          |       |
|       | 📅 Duration: Dec 01, 2026 – Dec 30, 2026 (30 Days)       |       |
|       |                                                          |       |
|       | Guidelines & Objectives:                                 |       |
|       | Establish daily healthy routines for hydration,          |       |
|       | mindfulness, and physical movement.                      |       |
|       |                                                          |       |
|       | STANDARDIZED CURRICULUM ACTIVITIES (3)                   |       |
|       | +------------------------------------------------------+ |       |
|       | | 💧 Daily Hydration (2L)                              | |       |
|       | |    Drink at least 2 liters of water daily.           | |       |
|       | |    Frequency: Daily | Target: 1                      | |       |
|       | +------------------------------------------------------+ |       |
|       | | 🧘 Morning Meditation (10 min)                       | |       |
|       | |    10 minutes mindful breathing.                     | |       |
|       | |    Frequency: Daily | Target: 1                      | |       |
|       | +------------------------------------------------------+ |       |
|       | | 🏃 30 min Cardio (3x/week)                           | |       |
|       | |    Running or fast walking.                          | |       |
|       | |    Frequency: 3x per week | Target: 3                | |       |
|       | +------------------------------------------------------+ |       |
|       |                                                          |       |
|       | [             Join Challenge Now             ]           |       |
|       +----------------------------------------------------------+       |
|                                                                          |
+--------------------------------------------------------------------------+
```

#### Detailed Component Specifications:

1. **Challenge Header Banner**:
   - Challenge Title (24px, Walnut `#724319`, bold).
   - Category Badge (e.g. `Wellness` in Golden Sand `#cad182`).
   - Organizer attribution: `"Organized by Dr. Jordan Wells (Wellness Director)"`.
   - Date range banner with icon: `📅 Dec 01, 2026 – Dec 30, 2026 (30 Days)`.
   - Guidelines description paragraph (Walnut text, regular weight).
2. **Curriculum Activities List**:
   - Each standardized activity rendered inside a clean bordered card (`#feeac7` border, white surface).
   - Activity Title, description, frequency pill, and target count.
3. **Primary Call to Action (`[ Join Challenge ]`)**:
   - **State A: Unauthenticated Visitor**:
     - Action button renders: `[ Sign In to Join Challenge ]`.
     - Clicking navigates to `/login?redirect=/challenges/:id`. After sign-in or registration as `PARTICIPANT`, user is routed back to the challenge invitation view.
   - **State B: Authenticated Participant (Not Yet Enrolled)**:
     - Primary button: `[ Join Challenge Now ]` (Solid Walnut `#724319`, height: 48px).
     - Clicking submits `POST /api/challenges/:id/join`.
     - Button displays loading spinner while request is in flight.
     - On HTTP 201 response, transitions to **State C** and displays banner: `"Enrolled in challenge! 3 curriculum habits have been added to your Habit Calendar."`
   - **State C: Already Enrolled Participant**:
     - Button changes to a disabled badge: `[ Enrolled ✓ ]` with a secondary primary link `[ Go to Habit Calendar → ]` navigating to `/calendar`.
     - Banner displays: `"You are enrolled in this challenge! Your curriculum habits are active on your calendar."`
   - **State D: Authenticated Program Manager**:
     - Join button is disabled.
     - Informational alert states: `"You are signed in as a Program Manager. Challenge participation is reserved for participants."`

---

### 5.5. Complete UI State Matrix & Responsive Adaptations

| State | Screen 5 (`/manager`) Behavior | Screen 6 (`/challenges/:id`) Behavior |
| :--- | :--- | :--- |
| **Loading State** | Skeleton cards rendered for managed programs list; builder form inputs disabled with pulsating shimmer. | Centered skeleton card showing title, date banner, and 3 activity placeholder rows. |
| **Empty State** | Managed programs list displays `"No challenges created yet. Use the form on the right to build your first challenge!"` | If challenge ID is invalid, unpublished, or archived: displays friendly 404 card: `"Challenge Not Found or Not Available"`. |
| **Validation Error** | Form fields highlight with red border (`#c62828`); error messages rendered with `aria-live="polite"`. | Inline error alert if enrollment fails (`aria-live="assertive"`). |
| **Submitting / Busy** | `[ Save Draft ]` and `[ Deploy to Web ]` buttons disabled; button text replaced with `"Saving..."` / `"Deploying..."`. | `[ Join Challenge ]` button disabled with spinner: `"Enrolling..."`. |
| **Network Failure** | Persistent toast: `"Unable to save challenge. Please check your network and try again."` Retry action enabled. | Error banner: `"Failed to join challenge. Please refresh and try again."` |

#### Responsive Breakpoint Adaptations:

* **Desktop Viewport (&ge; 992px)**:
  - Screen 5 renders a balanced 2-column grid: Managed Programs List on the left (50%), Challenge Builder Form on the right (50%).
  - Date inputs (`startDate`, `endDate`) sit side-by-side.
  - Centered containers constrained to `max-width: 1200px` on Papaya Whip canvas (`#feeac7`).
* **Tablet Viewport (768px – 991px)**:
  - Screen 5 stacks into a single-column layout: Challenge Builder Form sits above or below the Managed Programs List with full width.
  - Program cards expand to fill available horizontal space.
  - All buttons maintain &ge; 42px touch heights.
* **Mobile Viewport (< 768px)**:
  - Screen 5 renders fully stacked vertical layout: each input, button, and activity card spans 100% width.
  - Form actions (`[ Save Draft ]`, `[ Deploy to Web ]`) expand into full-width stacked touch targets (&ge; 44px height).
  - Screen 6 Challenge Invitation card spans 100% viewport width with 16px lateral padding and zero horizontal scrolling.
  - Touch-friendly activity deletion targets (`44px x 44px` minimum hit area).

---

## 6. Software Test Specification

In accordance with `docs/sprint-01/tests.md`, Feature 4 is verified through comprehensive API integration tests, UI component tests, and end-to-end browser journeys.

### 6.1. API Integration Tests (`server/tests/sprint-01/`)

#### 1. Manager Programs API Suite (`server/tests/sprint-01/manager.api.test.ts`)

Mapped directly to **API-12**, **API-13**, and **API-14**:

* **Test 1 (`API-12`): Program Manager creates challenge with standardized activities (`POST /api/manager/programs`)**:
  - Authenticate as demo Program Manager (`manager@habitless.internal`).
  - Submit payload with `title: "30-Day Wellness Challenge"`, `category: "Wellness"`, valid `startDate` & `endDate`, and 3 activities.
  - Assert HTTP `201 Created`.
  - Assert response matches Program DTO with `status: "DRAFT"`, `managerId: demoManager.id`, and 3 activity records.
  - Verify database records persisted in `challenge_programs` and `program_activities`.
* **Test 2 (`API-12` Boundaries & Validations): Strict boundary checks on program payloads**:
  - Boundary Pass: `title` exactly 3 characters &rarr; assert HTTP `201 Created`.
  - Boundary Pass: `title` exactly 100 characters &rarr; assert HTTP `201 Created`.
  - Boundary Pass: `startDate === endDate` (single-day challenge) &rarr; assert HTTP `201 Created`.
  - Boundary Fail: `title` = 2 characters &rarr; assert HTTP `422 Unprocessable Entity` on `title`.
  - Boundary Fail: `title` = 101 characters &rarr; assert HTTP `422 Unprocessable Entity` on `title`.
  - Boundary Fail: `endDate < startDate` &rarr; assert HTTP `422 Unprocessable Entity` (`BR-05`).
  - Boundary Fail: Empty `activities` array (`[]`) &rarr; assert HTTP `422 Unprocessable Entity`.
  - Boundary Fail: Description > 500 characters &rarr; assert HTTP `422 Unprocessable Entity` (`BR-04`).
  - Boundary Fail: Activity title < 2 chars or > 80 chars &rarr; assert HTTP `422 Unprocessable Entity` (`BR-03`).
* **Test 3 (`API-12` Draft Modification): Update draft challenge (`PUT /api/manager/programs/:id`)**:
  - Authenticate as owner Program Manager.
  - Update draft program title and add an activity &rarr; assert HTTP `200 OK`.
  - Verify database record reflects updated title and new activity count.
  - Attempt update on `PUBLISHED` program &rarr; assert HTTP `422 Unprocessable Entity` with `PROGRAM_NOT_EDITABLE`.
* **Test 4 (`API-13` Role Barrier): Rejects participant access to manager routes**:
  - Authenticate as demo Participant (`participant1@habitless.internal`).
  - Attempt `POST /api/manager/programs` &rarr; assert HTTP `403 Forbidden` (`BR-01`).
  - Attempt `GET /api/manager/programs` &rarr; assert HTTP `403 Forbidden` (`BR-01`).
  - Attempt `PUT /api/manager/programs/5/deploy` &rarr; assert HTTP `403 Forbidden` (`BR-01`).
* **Test 5 (`API-14`): Program Manager deploys challenge to web (`PUT /api/manager/programs/:id/deploy`)**:
  - Authenticate as owner Program Manager.
  - Deploy draft program &rarr; assert HTTP `200 OK`.
  - Assert response contains `status: "PUBLISHED"` and `inviteUrl: "/challenges/:id"`.
  - Verify database record in `challenge_programs` has `status = "PUBLISHED"`.
  - Subsequent deploy call returns idempotent HTTP `200 OK`.
* **Test 6 (`API-14` Ownership Barrier & ID Validation)**:
  - Register/authenticate secondary Program Manager (`manager2@habitless.internal`).
  - Attempt `PUT /api/manager/programs/:id/deploy` on primary manager's program &rarr; assert HTTP `403 Forbidden`.
  - Attempt deploy with non-existent ID `99999` &rarr; assert HTTP `404 Not Found`.
  - Attempt deploy with non-integer ID `/abc/deploy` &rarr; assert HTTP `400 Bad Request`.
* **Test 7: Archive challenge program (`PUT /api/manager/programs/:id/archive`)**:
  - Authenticate as owner Program Manager.
  - Archive published program &rarr; assert HTTP `200 OK` with `status: "ARCHIVED"`.
  - Verify database status updated to `ARCHIVED`.

---

#### 2. Challenges & Enrollment API Suite (`server/tests/sprint-01/challenges.api.test.ts`)

Mapped directly to **API-15**:

* **Test 1: Public retrieval of published challenge (`GET /api/challenges/:id`)**:
  - Unauthenticated client requests `GET /api/challenges/:id` for a published program.
  - Assert HTTP `200 OK`.
  - Assert response returns challenge metadata, organizer name, and list of curriculum activities.
  - Non-existent ID `99999` &rarr; assert HTTP `404 Not Found`.
  - Non-integer ID `/abc` &rarr; assert HTTP `400 Bad Request`.
* **Test 2: Draft and archived challenges hidden from public (`GET /api/challenges/:id`)**:
  - Request `GET /api/challenges/:id` for a program in `DRAFT` status &rarr; assert HTTP `404 Not Found`.
  - Request `GET /api/challenges/:id` for a program in `ARCHIVED` status &rarr; assert HTTP `404 Not Found`.
* **Test 3 (`API-15`): Participant enrolls in challenge & materializes calendar habits (`POST /api/challenges/:id/join`)**:
  - Authenticate as demo Participant (`participant1@habitless.internal`).
  - Invoke `POST /api/challenges/:id/join` on a published challenge with 3 activities.
  - Assert HTTP `201 Created`.
  - Assert response returns `enrollmentId`, matching `programId`, `participantId`, `habitsCreatedCount: 3`.
  - Verify database record in `program_enrollments`.
  - Verify 3 new `Habit` records created for `participant1` with matching `programId: 5`, default color `#448aff`, mapped frequencies, and calculated monthly target counts.
* **Test 4 (`API-15` Duplicate Guard): Duplicate enrollment rejected**:
  - Participant invokes `POST /api/challenges/:id/join` on the same challenge a second time.
  - Assert HTTP `409 Conflict` with error code `ALREADY_ENROLLED`.
* **Test 5 (`API-15` Role & Status Guards)**:
  - Unauthenticated user invokes `POST /api/challenges/:id/join` &rarr; assert HTTP `401 Unauthorized`.
  - Program Manager invokes `POST /api/challenges/:id/join` &rarr; assert HTTP `403 Forbidden`.
  - Participant attempts to join unpublished draft challenge &rarr; assert HTTP `404 Not Found`.
  - Participant attempts to join archived challenge &rarr; assert HTTP `404 Not Found`.

---

### 6.2. UI Component Tests (`client/tests/sprint-01/ProgramBuilder.test.tsx`)

Mapped directly to **UI-07**:

* **Test 1: Renders Program Builder form with required inputs**:
  - Mount `ProgramBuilder` component.
  - Verify inputs exist for Program Title (`*`), Category (`*`), Description, Start Date (`*`), and End Date (`*`).
  - Verify initial single activity row is rendered.
* **Test 2: Dynamic activity row addition and removal**:
  - Click `+ Add Activity` &rarr; assert two activity rows are rendered.
  - Click `+ Add Activity` again &rarr; assert three activity rows are rendered.
  - Click remove trashcan icon on row 2 &rarr; assert row count decrements to 2.
  - When exactly 1 activity remains, remove button is disabled or hidden.
* **Test 3: Date range and string boundary validation**:
  - Input `startDate = "2026-12-10"` and `endDate = "2026-12-05"`.
  - Click `Save Draft`.
  - Assert validation error banner is rendered (`"End date must be on or after start date."`).
  - Input `startDate = "2026-12-10"` and `endDate = "2026-12-10"` (single day) &rarr; error cleared.
* **Test 4: Submits valid draft challenge (`Save Draft`)**:
  - Fill valid form inputs and 2 activities.
  - Click `Save Draft`.
  - Assert API mock receives expected `POST /api/manager/programs` payload.
  - Assert success feedback is displayed.
* **Test 5: Deploys challenge and displays copyable invitation link**:
  - Trigger `Deploy to Web` action on draft challenge card.
  - Assert API mock receives `PUT /api/manager/programs/:id/deploy`.
  - Assert card status badge updates to `PUBLISHED` and displays `/challenges/:id` with `[ Copy Link ]` button.

---

### 6.3. End-to-End Browser Test (`e2e/sprint-01/manager-journey.spec.ts`)

Mapped directly to **E2E-03** and **AC-09**:

* **Full Manager Lifecycle & Participant Join Journey**:
  1. **Manager Sign In**:
     - Navigate to `/login`.
     - Sign in as `manager@habitless.internal` with valid credentials.
     - Verify automatic post-auth navigation to `/manager`.
  2. **Challenge Creation**:
     - Fill in Program Title: `"30-Day Wellness Challenge"`.
     - Select Category: `"Wellness"`.
     - Enter Start Date and End Date.
     - Add 3 activities: `"Daily Hydration (2L)"`, `"Morning Meditation (10 min)"`, `"30 min Cardio (3x/week)"`.
     - Click `Save Draft`.
     - Verify challenge appears in Managed Programs list with `DRAFT` badge.
  3. **Deploy to Web**:
     - Click `[ Deploy to Web ]` on the draft challenge card.
     - Verify badge updates to `PUBLISHED`.
     - Verify shareable invitation link `/challenges/:id` is rendered.
     - Click `[ Copy Link ]` &rarr; verify toast notification.
  4. **Participant Invitation, Join & Calendar Verification**:
     - Open new browser context / sign out.
     - Navigate to `/login` and sign in as `participant1@habitless.internal`.
     - Navigate directly to `/challenges/:id`.
     - Verify challenge details, organizer attribution, and 3 activities are rendered.
     - Click `[ Join Challenge Now ]`.
     - Verify button transitions to `[ Enrolled ✓ ]` and confirmation banner appears.
     - Navigate to `/calendar` &rarr; verify the 3 standardized challenge activities (`Daily Hydration (2L)`, `Morning Meditation (10 min)`, `30 min Cardio (3x/week)`) appear directly on the participant's habit tracking matrix.

---

### 6.4. Responsive, Visual & Accessibility Verifications

* **Viewport Matrix**:
  - Desktop (`1280x800`): Side-by-side builder and programs list; zero layout displacement.
  - Tablet (`768x1024`): Stacked builder layout; card widths adapt smoothly.
  - Mobile (`375x667`): Single-column vertical form; full-width buttons; zero horizontal scroll (`scrollWidth === clientWidth`).
* **Accessibility (`WCAG 2.1 AA`)**:
  - All form controls linked to explicit `<label>` tags with matching `htmlFor` / `id`.
  - Required fields annotated with `aria-required="true"`.
  - Dynamic activity additions and removals announced via `aria-live="polite"`.
  - Color contrast ratios exceed 4.5:1 for all Walnut `#724319` text on Papaya Whip `#feeac7` or white surfaces.

---

## 7. Reconciliations & Resolved Design Decisions

The following formal decisions resolve all ambiguities and audit findings:

### 1. Automatic Personal Habit Creation on Challenge Join
* **Resolution**: Confirmed and codified. `POST /api/challenges/:id/join` executes an atomic database transaction that generates `ProgramEnrollment` **and** materializes active personal `Habit` rows linked via `Habit.programId` for each `ProgramActivity`. Standardized defaults are assigned: color `#448aff`, mapped `daysOfWeek` (`DAILY` &rarr; `[1..7]`, `WEEKDAYS` &rarr; `[1..5]`, `THREE_TIMES_WEEKLY` &rarr; `[1,3,5]`), and monthly `targetCount` (e.g. 20 for daily). This ensures joined habits immediately appear on the participant's `/calendar` without manual duplication.

### 2. Separation of Public Challenge Route and Manager Preview Route
* **Resolution**: Confirmed. `GET /api/challenges/:id` is strictly public and cacheable; it enforces `status === "PUBLISHED"` and returns `404 Not Found` for any non-published (`DRAFT` or `ARCHIVED`) challenge. Manager inspection and preview of drafts is handled via the dedicated authenticated route `GET /api/manager/programs/:id`.

### 3. Duplicate Enrollment Handling on `POST /api/challenges/:id/join`
* **Resolution**: Confirmed. If an already-enrolled participant invokes `POST /api/challenges/:id/join`, the backend returns `409 Conflict` with error code `ALREADY_ENROLLED`. On the client, the UI renders the disabled button `[ Enrolled ✓ ]` with a direct link to `/calendar`, preventing redundant requests under normal navigation.

### 4. Validation Invariants for Program Activities
* **Resolution**: Confirmed. `ProgramActivity.title` is restricted to 2–80 characters (`BR-03`), `ProgramActivity.description` is restricted to &le; 500 characters (`BR-04`), and `targetCount` must be an integer &ge; 1 (defaulting to 1).

### 5. Draft Modification & Archival Endpoints
* **Resolution**: Added `PUT /api/manager/programs/:id` to allow managers to modify draft programs prior to deployment. Added `PUT /api/manager/programs/:id/archive` to support the `ARCHIVED` lifecycle transition defined in **BR-08**.
