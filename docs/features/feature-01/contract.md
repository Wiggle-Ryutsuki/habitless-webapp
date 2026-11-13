# Feature 1 Engineering Contract: User Authentication, Role-Based Access & Cloud Health Probes

**Feature ID**: FEATURE-HL-01  
**Target Branch**: `feature/1-auth-roles`  
**Base Branch**: `staging` (or `main`)  
**Status**: Approved Specification Baseline (Post-Review Revisions Applied)  
**Version**: 1.1  
**Sprint Alignment**: Sprint 1 (MVP Increment 1 of 4)  
**Parent Specifications**:  
- [`docs/sprint-01/specification.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/specification.md)  
- [`docs/sprint-01/api-spec.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/api-spec.md)  
- [`docs/sprint-01/ui-spec.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/ui-spec.md)  
- [`docs/sprint-01/tests.md`](file:///c:/Users/Maimoona%20Aziz/OneDrive/Desktop/habitless-webapp/docs/sprint-01/tests.md)  

---

## 1. Purpose, Scope, and Explicit Exclusions

### 1.1. Purpose & Deliverables
Feature 1 establishes the foundational security, identity, routing, and cloud infrastructure layer for HabitLess. It delivers:
1. **User Registration (`Sign Up`)**: Self-service onboarding for new users with role selection (`PARTICIPANT` vs `PROGRAM_MANAGER`), canonical email normalization, and automatic authenticated session establishment.
2. **User Authentication (`Login / Logout`)**: Credential validation, secure password verification with bcrypt, inactive account rejection, and clean session termination.
3. **Session Management & Token Transmission**: Issue and validation of signed JWT tokens stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies (with backward-compatible fallback support for `Authorization: Bearer <token>`).
4. **Role-Based Access Control (RBAC) & Routing**:
   - `PARTICIPANT` users route to `/dashboard` (or valid internal `redirect` path).
   - `PROGRAM_MANAGER` users route to `/manager` (or valid internal `redirect` path).
   - Backend RBAC middleware enforcing authentication (`401 Unauthorized`) and active status, alongside role barriers (`403 Forbidden`).
5. **Cloud Health & Database Readiness Probes**:
   - `GET /api/health` for Cloud Run container lifecycle checks.
   - `GET /api/ready` for PostgreSQL database connectivity ping (`SELECT 1`) with sanitized error responses.
6. **Application Shell Header & Auth Route Guards**:
   - Responsive header displaying HabitLess brand, active role badge, user identifier, and `[ Log Out ]` button, with mobile drawer support for viewports < 768px.
   - Client-side route guards featuring an `INITIALIZING` state to eliminate race-condition redirects during session rehydration.

---

### 1.2. Explicit Exclusions (Strict Scope Boundary)

To ensure this increment remains isolated and strictly constrained:
* **Excluded Features (Deferred to Features 2–4)**:
  - Custom habit creation, habit editing, and deletion (Feature 2 & 3).
  - 8-color habit swatch picker and habit color validation (Feature 2).
  - Today's checklist view and completion toggling (Feature 2).
  - Daily habit tracker 31-day calendar matrix desktop (Feature 3).
  - In-calendar habit editing and calendar reflection notes (Feature 3).
  - Monthly Goals Tracker target vs. achieved calculations (Feature 3).
  - Challenge program builder, activity definition, and publishing/deployment (Feature 4).
  - Challenge web invitation landing page and participant enrollment (Feature 4).
* **Excluded Non-MVP Features (Deferred to Post-Sprint 1 per `_lab5_sec31_habitless.pdf`)**:
  - Active roster management and participant removal/deactivation.
  - Challenge or category popularity statistics.
  - Habit streaks, longest streak, and gamification counters.
  - Arbitrary custom hex color picker (fixed tokens only).
  - Bug report forms.
  - Daily mood tracker calendar.
  - Email or SMS reminder notifications.
  - One-click CSV log export.
  - Challenge popularity rankings.

---

## 2. Requirements Traceability Matrix

| Requirement / Rule / AC | Description | Implementation Target in Feature 1 |
| :--- | :--- | :--- |
| **FR-01** | Account Registration (Sign Up) | `POST /api/auth/register`, `/register` form with `fullName`, `email`, `password`, and role selector (`PARTICIPANT` / `PROGRAM_MANAGER`). |
| **FR-02** | Authentication & Logout | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `/login` UI form. |
| **FR-03** | Cloud Health & Readiness | `GET /api/health` (HTTP 200), `GET /api/ready` (HTTP 200 on DB connection, HTTP 503 with sanitized message on failure). |
| **BR-01** | Role Isolation Boundary | RBAC middleware (`requireAuth`, `requireRole`) protecting private resources. Returns HTTP 401 when unauthenticated/inactive and HTTP 403 when role is unauthorized. |
| **BR-07** | Password Security Policy | Minimum 8 characters, maximum 128 characters; passwords hashed with bcrypt (salt factor 10) prior to persistence. No arbitrary symbol regex required for MVP. Plaintext passwords never logged or returned in responses. |
| **AC-01** | User Registration & Role Routing | Submitting valid registration creates active user in PostgreSQL, sets session cookie, and routes to `/dashboard` for `PARTICIPANT` or `/manager` for `PROGRAM_MANAGER` (or internal `redirect` query parameter). |
| **AC-02** | Authentication & Manager Routing | Logging in with `PROGRAM_MANAGER` credentials establishes session and routes to `/manager` (or internal `redirect` query parameter). |

---

## 3. Data Design & Seed Specifications

### 3.1. Minimal Prisma Schema (`server/prisma/schema.prisma`)
This increment introduces **only** the `Role` enum and `User` model. All relations to `Habit`, `HabitLog`, `DailyNote`, `ChallengeProgram`, and `ProgramEnrollment` are strictly omitted until their respective feature increments:

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

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  fullName     String
  role         Role     @default(PARTICIPANT)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

### 3.2. Idempotent Seed Script (`server/prisma/seed.ts`)
The seed script executes idempotent `upsert` operations on `email` so it can run repeatedly in CI/CD without duplication or error:

```typescript
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'ManagerPass123!';
  const defaultUserPassword = process.env.DEMO_USER_PASSWORD || 'ParticipantPass123!';

  const managerHash = await bcrypt.hash(adminPassword, 10);
  const userHash = await bcrypt.hash(defaultUserPassword, 10);

  // 1. Demo Program Manager
  await prisma.user.upsert({
    where: { email: 'manager@habitless.internal' },
    update: {
      fullName: 'Dr. Jordan Wells (Wellness Director)',
      role: Role.PROGRAM_MANAGER,
      passwordHash: managerHash,
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

  // 2. Demo Participant 1
  await prisma.user.upsert({
    where: { email: 'participant1@habitless.internal' },
    update: {
      fullName: 'Alex Rivera',
      role: Role.PARTICIPANT,
      passwordHash: userHash,
      isActive: true,
    },
    create: {
      email: 'participant1@habitless.internal',
      fullName: 'Alex Rivera',
      role: Role.PARTICIPANT,
      passwordHash: userHash,
      isActive: true,
    },
  });

  // 3. Demo Participant 2
  await prisma.user.upsert({
    where: { email: 'participant2@habitless.internal' },
    update: {
      fullName: 'Taylor Chen',
      role: Role.PARTICIPANT,
      passwordHash: userHash,
      isActive: true,
    },
    create: {
      email: 'participant2@habitless.internal',
      fullName: 'Taylor Chen',
      role: Role.PARTICIPANT,
      passwordHash: userHash,
      isActive: true,
    },
  });

  console.log('Seed completed successfully: 1 Manager, 2 Participants.');
}

main()
  .catch((e) => {
    console.error('Seed failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

*(Note: Seeding of Challenge Programs, Habits, and Daily Logs is deferred to Features 2–4).*

---

## 4. API Contract & Security Protocol

### 4.1. Global Conventions
* **Prefix**: `/api`
* **Content-Type**: `application/json`
* **JSON Properties**: `camelCase`
* **Date Representation**: ISO 8601 UTC string (`YYYY-MM-DDTHH:mm:ss.sssZ`)
* **Security Invariant**: `passwordHash` must **never** be serialized or leaked in any API response, error payload, or log.
* **Canonical Email Normalization**: The backend must execute `email = email.trim().toLowerCase()` prior to querying or saving records in PostgreSQL to eliminate duplicate casing bugs.

### 4.2. Standard Error Envelope
All error responses return a uniform envelope with an HTTP status code &ge; 400:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload failed validation.",
    "fieldErrors": [
      {
        "field": "email",
        "message": "A valid email address is required."
      }
    ],
    "correlationId": "hl-req-7f3b8e1a-4c2d-4819-bf93-6a9b4d8c11e2"
  }
}
```

Standard error codes:
* `VALIDATION_ERROR` (400, 422)
* `UNAUTHORIZED` (401)
* `FORBIDDEN` (403)
* `NOT_FOUND` (404)
* `CONFLICT` (409)
* `INTERNAL_SERVER_ERROR` (500)
* `SERVICE_UNAVAILABLE` (503)

---

### 4.3. Endpoint Specifications

#### 1. System Health Probe
* **Route**: `GET /api/health`
* **Access**: Public
* **Purpose**: Basic service uptime check for Cloud Run and load balancers.
* **Success Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "HabitLess API",
  "timestamp": "2026-11-13T07:00:00.000Z"
}
```

#### 2. Database Readiness Probe
* **Route**: `GET /api/ready`
* **Access**: Public
* **Purpose**: Verifies active database connectivity by executing `SELECT 1`.
* **Success Response `200 OK`**:
```json
{
  "status": "ready",
  "db": "connected"
}
```
* **Failure Response `503 Service Unavailable`**:
  * **Security Directive**: The backend catch block must **never pass raw PostgreSQL driver error strings** (`err.message`, hostnames, or credentials) into the response. The error message is always sanitized.
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Database connection is not ready.",
    "correlationId": "hl-req-ready-fail-001"
  }
}
```

#### 3. User Registration
* **Route**: `POST /api/auth/register`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "alex.rivera@example.com",
  "password": "SecurePassword123!",
  "fullName": "Alex Rivera",
  "role": "PARTICIPANT"
}
```
* **Validation & Sanitization Rules**:
  * `email`: required, valid email format, trimmed and converted to lowercase, max 255 chars.
  * `password`: required string, minimum 8 characters, maximum 128 characters. No regex complexity rules enforced for MVP.
  * `fullName`: required string, length 2–80 characters after trimming. Must contain at least one non-whitespace character.
  * `role`: required string enum: `PARTICIPANT` or `PROGRAM_MANAGER`.
* **Success Response `201 Created`**:
  * Sets `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
```json
{
  "user": {
    "id": 1,
    "email": "alex.rivera@example.com",
    "fullName": "Alex Rivera",
    "role": "PARTICIPANT",
    "isActive": true,
    "createdAt": "2026-11-13T07:05:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Error Responses**:
  * `409 Conflict`: If normalized `email` already exists in `users`:
    ```json
    {
      "error": {
        "code": "CONFLICT",
        "message": "An account with this email already exists."
      }
    }
    ```
  * `422 Unprocessable Entity`: Field validation failure (invalid email format, password < 8 chars, invalid role enum).

#### 4. User Login
* **Route**: `POST /api/auth/login`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "alex.rivera@example.com",
  "password": "SecurePassword123!"
}
```
* **Validation & Sanitization Rules**:
  * `email`: required string, trimmed and converted to lowercase.
  * `password`: required string.
* **Success Response `200 OK`**:
  * Sets `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
```json
{
  "user": {
    "id": 1,
    "email": "alex.rivera@example.com",
    "fullName": "Alex Rivera",
    "role": "PARTICIPANT",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Error Responses**:
  * `401 Unauthorized`: For incorrect password, non-existent user, or inactive user (`isActive: false`):
    ```json
    {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Invalid email or password."
      }
    }
    ```

#### 5. User Logout
* **Route**: `POST /api/auth/logout`
* **Access**: Authenticated
* **Behavior**: Clears the session cookie (`Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`).
* **Success Response `200 OK`**:
```json
{
  "message": "Logged out successfully"
}
```

#### 6. Current User Profile
* **Route**: `GET /api/auth/me`
* **Access**: Authenticated
* **Success Response `200 OK`**:
```json
{
  "id": 1,
  "email": "alex.rivera@example.com",
  "fullName": "Alex Rivera",
  "role": "PARTICIPANT",
  "isActive": true
}
```
* **Error Responses**:
  * `401 Unauthorized`: If cookie / token is missing, expired, signature invalid, or user account is inactive (`isActive: false`).

---

### 4.4. Security, Token Transmission & RBAC Middleware

1. **JWT Payload Structure**:
```json
{
  "sub": 1,
  "email": "alex.rivera@example.com",
  "role": "PARTICIPANT",
  "iat": 1731481200,
  "exp": 1732086000
}
```
2. **Transmission Rules**:
   - Primary: `HttpOnly`, `Secure` (in production), `SameSite=Lax` cookie named `token`.
   - Fallback: `Authorization: Bearer <token>` header to accommodate automated API tests and integration tools.
3. **RBAC Middleware Flow**:
   - `requireAuth`: Reads token from cookie or `Authorization` header, verifies signature via `JWT_SECRET`, queries database for user `WHERE id = sub AND isActive = true`.
     - **Inactive / Deleted Check**: If user record does not exist or `user.isActive === false`, the middleware **immediately rejects** with `401 Unauthorized` (`code: "UNAUTHORIZED"`).
     - **Success**: Attaches `req.user = { id: user.id, email: user.email, role: user.role }`.
   - `requireRole(allowedRoles: Role[])`: Checks if `allowedRoles.includes(req.user.role)`.
     - If unauthorized: Immediately responds with `403 Forbidden` (`code: "FORBIDDEN"`, message: `"Access denied: insufficient permissions."`).

---

## 5. UI Specification & Client States

### 5.1. Design Tokens & Theme Application
Feature 1 screens strictly use the **HabitLess Warm Natural Palette** for the authentication card and navigation shell:

* `--walnut`: `#724319` (Headers, branding, primary buttons)
* `--light-coral`: `#d88180` (Active borders, secondary actions)
* `--powder-blush`: `#f7b1b0` (Card borders, focus rings)
* `--papaya-whip`: `#feeac7` (Canvas background, input backgrounds)
* `--golden-sand`: `#cad182` (Role accent badges)
* `--color-surface`: `#FFFFFF` (Card container surface)
* `--color-text-main`: `#2D1C0B` (High contrast text)
* `--color-error`: `#B3261E` (Validation errors)
* `--color-error-bg`: `#FDF2F2` (Error banners)
* Canvas Gradient: `$gradient-right: linear-gradient(90deg, #724319ff, #d88180ff, #f7b1b0ff, #feeac7ff, #cad182ff);`

### 5.2. Screen 1: Registration (`/register`) & Login (`/login`)
* **Container**: Centered card with `max-width: 440px`, padding `32px`, border-radius `12px`, border `1px solid var(--powder-blush)`, surface `var(--color-surface)`.
* **Header**: Brand title **HabitLess** in `--walnut` (font size `1.875rem`, bold) with subtitle *"Habit and Activity Tracking System"*.
* **Form Inputs & Attributes**:
  - Standard height: `42px`, border radius `6px`, border `1px solid var(--color-border-subtle)`, background `var(--papaya-whip)` or white.
  - Required fields annotated with red asterisk (`*`).
  - `email`: `type="email"`, `autoComplete="email"`, auto-trimmed.
  - `password`: `type="password"`, `autoComplete="current-password"` (login) or `autoComplete="new-password"` (register).
  - Primary autofocus: `fullName` on `/register`, `email` on `/login`.
  - Validation messages rendered directly under the affected field with `aria-live="polite"` in `--color-error`.
* **Role Selection (`/register` only)**:
  - Radio button group styled with clear visual distinction:
    - `[x] Participant` (Default)
    - `[ ] Program Manager`
* **Submit Action**: Solid `--walnut` button with white text, full width, height `44px`. Shows inline spinner and is disabled during submission.
* **Toggle Link**:
  - On `/login`: *"Don't have an account? Sign Up"* &rarr; routes to `/register`.
  - On `/register`: *"Already have an account? Sign In"* &rarr; routes to `/login`.

### 5.3. Application Shell Header (Post-Auth)
Upon successful authentication, the user is greeted with the global header:

```
Desktop (>= 768px):
+----------------------------------------------------------------------------------------------------+
|  HabitLess   [ Today's Checklist ]  [ Habit Calendar ]                                             |
|                                            (o) Alex Rivera [PARTICIPANT]     [ Log Out ]            |
+----------------------------------------------------------------------------------------------------+

Mobile (< 768px):
+----------------------------------------------------------------------------------------------------+
|  HabitLess                                                                              [ ☰ Menu ] |
+----------------------------------------------------------------------------------------------------+
  [ Mobile Drawer (Overlay when open) ]
  • User: Alex Rivera
  • Role: PARTICIPANT
  • Today's Checklist (Placeholder)
  • Habit Calendar (Placeholder)
  • [ Log Out ] (Solid Walnut Button)
```

* **Branding**: Left-aligned **HabitLess** logo link.
* **Navigation Placeholders**:
  - For `PARTICIPANT`: Nav items `Today's Checklist` (`/dashboard`), `Habit Calendar` (`/calendar`). (Links render disabled or blank until Features 2 & 3).
  - For `PROGRAM_MANAGER`: Nav item `Programs` (`/manager`). (Renders disabled or blank until Feature 4).
* **Responsive Behavior**:
  - **Desktop / Tablet (&ge; 768px)**: Horizontal flex layout showing user name, role badge, navigation links, and `[ Log Out ]` button.
  - **Mobile (< 768px)**: Displays brand title and a `[ ☰ Menu ]` toggle button. Clicking toggles an accessible overlay drawer containing user information, role badge, navigation links, and the `[ Log Out ]` button. Prevents any horizontal viewport clipping.
* **Log Out Action**: Triggers `POST /api/auth/logout`, clears client auth state, and redirects to `/login`.

### 5.4. Client Auth & Route-Guard State Matrix

| State Scenario | Trigger / Condition | UI / Route Behavior |
| :--- | :--- | :--- |
| **INITIALIZING / AUTH_LOADING** | Page reload (`F5`) or cold start while `GET /api/auth/me` is in-flight | Route guards render a full-page loading placeholder; **no redirects** are triggered until the request resolves. |
| **Unauthenticated** | `GET /api/auth/me` fails (401) and user attempts accessing `/dashboard`, `/calendar`, or `/manager` | Redirects to `/login?redirect=<path>`. |
| **Submitting / Busy** | User clicks "Sign In" or "Create Account" | Button disables, shows loading spinner, inputs become read-only. |
| **Client Validation Error** | Empty required field, email missing `@`, password < 8 chars | Form submission halted; red field border and inline error message below input. |
| **401 Invalid Credentials** | Backend returns `401 Unauthorized` on `/api/auth/login` | Renders alert banner: *"Invalid email or password."* in `--color-error-bg`. |
| **409 Duplicate Email** | Backend returns `409 Conflict` on `/api/auth/register` | Focuses email input, displays: *"An account with this email already exists."* |
| **Network / Server Error** | Backend unreachable or returns `500` | Alert banner: *"Unable to connect. Please check your connection and try again."* |
| **Participant Success** | Login/Register succeeds with `role: "PARTICIPANT"` | Session saved; routed to safe internal `redirect` query parameter, defaulting to `/dashboard`. |
| **Manager Success** | Login/Register succeeds with `role: "PROGRAM_MANAGER"` | Session saved; routed to safe internal `redirect` query parameter, defaulting to `/manager`. |
| **Role Guard Failure** | Authenticated `PARTICIPANT` navigates to `/manager` | Route guard halts navigation; redirects to `/dashboard` with an alert: *"Access restricted."* |

---

## 6. Software Test Specification

### 6.1. Planned Test Mapping

| Test ID | Scope / Type | Target File | Verification Details | Target Status |
| :--- | :--- | :--- | :--- | :--- |
| **API-01** | API Integration | `server/tests/sprint-01/health.api.test.ts` | 1. `GET /api/health` returns HTTP 200 with `{ status: "ok" }`.<br>2. `GET /api/ready` executes `SELECT 1` and returns HTTP 200 `{ status: "ready", db: "connected" }`.<br>3. `GET /api/ready` returns HTTP 503 with sanitized message `{ error: { code: "SERVICE_UNAVAILABLE" } }` when DB connection is dropped. | Planned |
| **API-02** | API Integration | `server/tests/sprint-01/auth.api.test.ts` | 1. Submitting valid registration creates user in DB with `role=PARTICIPANT`, hashes password with bcrypt, sets HTTP-only cookie, and returns HTTP 201 with user object (strictly omitting `passwordHash`).<br>2. Submitting registration with role `PROGRAM_MANAGER` creates user with manager role.<br>3. Verifies email is stored lowercased.<br>4. Boundary tests: password < 8 chars returns 422; invalid email returns 422; invalid role (e.g. `"ADMIN"`) returns 422; whitespace-only name returns 422. | Planned |
| **API-03** | API Integration | `server/tests/sprint-01/auth.api.test.ts` | Submitting registration with already registered email (even with different casing, e.g. `ALEX@example.com`) returns HTTP 409 Conflict with standard error envelope. | Planned |
| **API-04** | API Integration | `server/tests/sprint-01/auth.api.test.ts` | 1. Valid login returns HTTP 200 with JWT and user profile (omitting `passwordHash`).<br>2. Invalid password returns HTTP 401 Unauthorized.<br>3. Inactive account (`isActive: false`) returns HTTP 401 Unauthorized.<br>4. `POST /api/auth/logout` clears session cookie.<br>5. `GET /api/auth/me` with cookie returns profile; without cookie returns HTTP 401; with inactive account returns HTTP 401.<br>6. **RBAC Test**: Calling endpoint protected by `requireRole([Role.PROGRAM_MANAGER])` with a valid `PARTICIPANT` token returns HTTP 403 Forbidden (`code: "FORBIDDEN"`). | Planned |
| **UI-01** | UI Component | `client/tests/sprint-01/AuthForm.test.tsx` | 1. Renders email, password (`type="password"`), full name, and role selector radio buttons.<br>2. Enforces required fields and client-side password length &ge; 8.<br>3. Displays inline error messages with `aria-live="polite"`.<br>4. Toggles between Login and Registration views.<br>5. Disables submit button and displays loading state during submission. | Planned |
| **E2E-01 (Auth)** | End-to-End | `e2e/sprint-01/participant-journey.spec.ts` | Navigates to `/register` &rarr; registers as `PARTICIPANT` &rarr; verifies redirect to `/dashboard` &rarr; refreshes page &rarr; verifies session persists without login redirect &rarr; clicks Logout &rarr; verifies redirect to `/login`. | Planned |
| **E2E-03 (Auth)** | End-to-End | `e2e/sprint-01/manager-journey.spec.ts` | Navigates to `/login` &rarr; logs in with Manager seed credentials &rarr; verifies redirect to `/manager` &rarr; verifies manager role badge in header. | Planned |

### 6.2. Security & Header Assertions
* `Set-Cookie` contains `HttpOnly`, `SameSite=Lax`, and `Path=/`.
* Response JSON never contains `passwordHash`, `password`, or sensitive stack traces.
* Protected endpoints reject requests without token or with `isActive: false` with HTTP 401.
* Manager endpoints reject participant tokens with HTTP 403.
* Health/Readiness failure responses never expose database driver connection parameters or credentials.

### 6.3. Responsive & Accessibility Checks
* **Desktop (&ge; 992px)**: Card centered horizontally and vertically on `$gradient-right` canvas.
* **Tablet (768px – 991px)**: Card width `440px` with 24px margins.
* **Mobile (< 768px)**: Card expands to full-width with `16px` padding; touch targets &ge; 44px; header collapses to hamburger menu drawer with zero horizontal scroll.
* **WCAG 2.2 AA**: Color contrast for `--walnut` text on `--papaya-whip` exceeds 4.5:1 (actual `7.6:1`); input controls accessible via keyboard `Tab`; error announcements use `aria-live="polite"`.

---

## 7. Reconciliations & Audit Resolution Log

All findings from the formal specification audit have been incorporated into this contract:
1. **Inactive User Check in Middleware**: Mandated in Section 4.4 and tested in Section 6.1 (`API-04`).
2. **Page Refresh Race Condition**: Resolved in Section 5.4 with the `INITIALIZING / AUTH_LOADING` state.
3. **Post-Registration Routing & AC-01**: Expanded in Section 2 and Section 5.4 to support both roles and honor safe internal `redirect` parameters.
4. **Mobile Shell Header Layout**: Solved in Section 5.3 and 6.3 with the mobile hamburger drawer specification.
5. **Canonical Email Normalization**: Mandated in Section 4.1, 4.3.3, and 4.3.4 (`email.trim().toLowerCase()`).
6. **RBAC 403 Integration Test**: Explicitly specified in Section 6.1 under `API-04`.
7. **Readiness Error Sanitization**: Mandated in Section 4.3.2 to prevent raw database driver string leakage.
8. **Password Complexity & Attributes**: Clarified in Section 2, 4.3.3, and 5.2 (`type="password"`, length 8–128 chars, no forced symbol regex for MVP).
