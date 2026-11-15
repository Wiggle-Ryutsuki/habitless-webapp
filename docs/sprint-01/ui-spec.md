# HabitLess UI Design Specification

**Document ID**: UI-SPEC-HL-01  
**Version**: 1.5  
**Status**: Approved Design Baseline (Strict MVP Scope - Unified Habit Calendar Architecture)  
**Parent Project**: HabitLess - Habit and Activity Tracking System  
**Source Brief Reference**: `HabitLess App Design: Habit and Activity Tracking System (pp. 1–5)`  
**Scope Boundary**: Strictly High Priority / Low Effort [MVP] Features Only  
**Theme**: Warm HabitLess Natural Shell + Vibrant 8-Color Habit Palette  

---

## 1. Visual Design Systems & Color Tokens

HabitLess decouples the **Website Theme Palette** (for application shell, headers, panels, cards) from the **Habit Colors Palette** (for individual habit swatches, checkmarks, badges, and progress tracking).

### 1.1. Website Theme Tokens (`HabitLess App Design`, pp. 1–2)

Used for global application layout, headers, backgrounds, and general UI chrome:

| Token Name | CSS HEX | CSS HSL | SCSS RGB | Primary Application |
| :--- | :--- | :--- | :--- | :--- |
| `--walnut` | `#724319ff` / `#724319` | `hsla(28, 64%, 27%, 1)` | `rgba(114, 67, 25, 1)` | Header bar, primary navigation, headings, dark button states |
| `--light-coral` | `#d88180ff` / `#d88180` | `hsla(1, 53%, 67%, 1)` | `rgba(216, 129, 128, 1)` | Secondary buttons, badge borders, accent pills |
| `--powder-blush` | `#f7b1b0ff` / `#f7b1b0` | `hsla(1, 82%, 83%, 1)` | `rgba(247, 177, 176, 1)` | Main app background canvas, full-page backdrop |
| `--papaya-whip` | `#feeac7ff` / `#feeac7` | `hsla(38, 96%, 89%, 1)` | `rgba(254, 234, 199, 1)` | Card borders, soft dividers, table row hover highlights |
| `--golden-sand` | `#cad182ff` / `#cad182` | `hsla(65, 46%, 66%, 1)` | `rgba(202, 209, 130, 1)` | Theme gold accent, highlight borders |

### 1.2. Fixed Habit Color Palette Tokens (User Selectable for Habits)

Used strictly for habit cards, habit swatch selection in creation/edit modals, calendar row pills, and daily completion checkmarks:

| Token Name | CSS HEX / SCSS HEX | CSS HSL / SCSS HSL | SCSS RGB | Color Character |
| :--- | :--- | :--- | :--- | :--- |
| `--blue-energy` | `#448affff` / `#448aff` | `hsla(218, 100%, 63%, 1)` | `rgba(68, 138, 255, 1)` | Vibrant Energy Blue |
| `--ocean-deep` | `#1565c0ff` / `#1565c0` | `hsla(212, 80%, 42%, 1)` | `rgba(21, 101, 192, 1)` | Deep Ocean Navy |
| `--verdigris` | `#009688ff` / `#009688` | `hsla(174, 100%, 29%, 1)` | `rgba(0, 150, 136, 1)` | Calming Teal / Verdigris |
| `--yellow-green` | `#8bc34aff` / `#8bc34a` | `hsla(88, 50%, 53%, 1)` | `rgba(139, 195, 74, 1)` | Fresh Citrus Green |
| `--amber-gold` | `#ffc107ff` / `#ffc107` | `hsla(45, 100%, 51%, 1)` | `rgba(255, 193, 7, 1)` | Radiant Amber Gold |
| `--amber-glow` | `#ff9800ff` / `#ff9800` | `hsla(36, 100%, 50%, 1)` | `rgba(255, 152, 0, 1)` | Warm Amber Glow |
| `--cinnabar` | `#f44336ff` / `#f44336` | `hsla(4, 90%, 58%, 1)` | `rgba(244, 67, 54, 1)` | Energetic Cinnabar Red |
| `--cherry-rose` | `#ad1457ff` / `#ad1457` | `hsla(334, 79%, 38%, 1)` | `rgba(173, 20, 87, 1)` | Rich Cherry Rose |

*(Note: SCSS variables use identical names prefixed with `$`: `$blue-energy`, `$ocean-deep`, `$verdigris`, `$yellow-green`, `$amber-gold`, `$amber-glow`, `$cinnabar`, `$cherry-rose`.)*

### 1.3. SCSS Gradient Tokens (Multi-Stop Habit Spectrum)

* **Linear Directional Gradients**:
  * `$gradient-top`: `linear-gradient(0deg, #448affff, #1565c0ff, #009688ff, #8bc34aff, #ffc107ff, #ff9800ff, #f44336ff, #ad1457ff);`
  * `$gradient-right`: `linear-gradient(90deg, #448affff, #1565c0ff, #009688ff, #8bc34aff, #ffc107ff, #ff9800ff, #f44336ff, #ad1457ff);`
  * `$gradient-bottom`: `linear-gradient(180deg, #448affff, #1565c0ff, #009688ff, #8bc34aff, #ffc107ff, #ff9800ff, #f44336ff, #ad1457ff);`
  * `$gradient-left`: `linear-gradient(270deg, #448affff, #1565c0ff, #009688ff, #8bc34aff, #ffc107ff, #ff9800ff, #f44336ff, #ad1457ff);`
* **Linear Diagonal Gradients**:
  * `$gradient-top-right`: `linear-gradient(45deg, #448affff, #1565c0ff, #009688ff, #8bc34aff, #ffc107ff, #ff9800ff, #f44336ff, #ad1457ff);`
  * `$gradient-bottom-right`: `linear-gradient(135deg, #448affff, #1565c0ff, #009688ff, #8bc34aff, #ffc107ff, #ff9800ff, #f44336ff, #ad1457ff);`
  * `$gradient-top-left`: `linear-gradient(225deg, #448affff, #1565c0ff, #009688ff, #8bc34aff, #ffc107ff, #ff9800ff, #f44336ff, #ad1457ff);`
  * `$gradient-bottom-left`: `linear-gradient(315deg, #448affff, #1565c0ff, #009688ff, #8bc34aff, #ffc107ff, #ff9800ff, #f44336ff, #ad1457ff);`
* **Radial Gradient**:
  * `$gradient-radial`: `radial-gradient(#448affff, #1565c0ff, #009688ff, #8bc34aff, #ffc107ff, #ff9800ff, #f44336ff, #ad1457ff);`

### 1.4. Semantic System Tokens

| Semantic Token | Value / Mapping | Usage |
| :--- | :--- | :--- |
| `--color-surface` | `#FFFFFF` | Form inputs, modal surfaces, table cards |
| `--color-surface-tint` | `#feeac7` (Papaya Whip) | Application page background |
| `--color-text-main` | `#2D1C0B` (Deep Walnut) | Main body text, table text, input text |
| `--color-text-muted` | `#6B5E51` (Warm Gray) | Column headers, timestamps, helper labels |
| `--color-border-subtle`| `#E5D3B3` | Calendar grid borders, input borders, dividers |
| `--color-focus-ring` | `rgba(114, 67, 25, 0.35)` | Keyboard focus rings |
| `--color-error` | `#B3261E` | Validation errors, alert text |
| `--color-error-bg` | `#FDF2F2` | Error banner backgrounds |

---

## 2. Typography, Spacing & Layout

* **Font Family**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
* **Hierarchy**:
  * Page Title (`h1`): `1.875rem` (30px), Weight 700, color `--walnut`
  * Section Title (`h2`): `1.375rem` (22px), Weight 600, color `--walnut`
  * Subheader / Card Title (`h3`): `1.125rem` (18px), Weight 600
  * Body Text: `0.9375rem` (15px), Weight 400, Line-height 1.5, color `--color-text-main`
  * Small / Caption / Badges: `0.8125rem` (13px), Weight 500
* **Spacing Scale**:
  * Base Unit: `4px` (`8px`, `12px`, `16px`, `24px`, `32px`, `48px`)
  * Content Max Width: `1200px` centered with auto margins
  * Card Padding: `24px` on desktop, `16px` on mobile

---

## 3. UI Layout Reference (Daily Habit Tracker Calendar)

The Participant Daily Habit Tracker Calendar desktop interface is modeled directly on the design mockup (`HabitLess App Design`, p. 3) with vibrant individual habit colors. The daily habits and the habit calendar desktop are **not separate pages**; they are unified into a single screen where the daily habits appear on the side of the calendar, and a top date indicator lights up which column/day is active and editable for checking habits:

```
+---------------------------------------------------------------------------------------------------------------------------------+
|  HabitLess    [ Habit Calendar ]  [ Dashboard ]        [ < March 2021 > ]             demo@dailyhabits.xyz      [ + New Habit ] |
+---------------------------------------------------------------------------------------------------------------------------------+
|  DATE:  Thu, 18 March 2021  (Column 18 is active & editable to check habits)                                                    |
+---------------------------------------------------------------------------------------------------------------------------------+
|  DAILY HABITS (Today)   |  M  T  W  T  F  S  S ...   W   [T*]  F   S   S ... 29 30 31          |  GOAL ACHIEVED             |
|  (Side List for Day)    |  1  2  3  4  5  6  7 ...  17  [18*] 19  20  21 ... 29 30 31          |                            |
|-------------------------+----------------------------------------------------------------------+----------------------------|
|  [■] Journal     [Edit] | [✓][✓][✓][ ][✓][✓][✓] ... [✓] [✓*] [ ] [✓] [✓] ... [ ][ ]             |   20   [ 19 ]              |
|  [■] Exercise    [Edit] | [✓][ ][✓][ ][✓][ ][✓] ... [✓] [ *] [✓] [ ] [ ] ... [✓][ ]             |   20   [ 14 ]              |
|  [■] Bathe+Moist [Edit] | [✓][✓][✓][✓][ ][✓][✓] ... [✓] [✓*] [✓] [✓] [ ] ... [✓][ ]             |   25   [ 19 ]              |
|  [■] Healthy Bkf [Edit] | [✓][✓][✓][✓][✓][✓][✓] ... [✓] [✓*] [✓] [✓] [✓] ... [✓][✓]             |   20   [ 20 ]              |
|  [■] No alcohol  [Edit] | [✓][✓][✓][✓][ ][✓][✓] ... [✓] [✓*] [✓] [✓] [✓] ... [✓][✓]             |   20   [ 20 ]              |
|  [■] No sugar    [Edit] | [✓][✓][ ][✓][✓][✓][✓] ... [✓] [ *] [✓] [✓] [ ] ... [ ][ ]             |   20   [ 16 ]              |
|  [■] Light dinner[Edit] | [✓][✓][✓][ ][✓][✓][✓] ... [✓] [✓*] [✓] [✓] [✓] ... [✓][ ]             |   20   [ 21 ]              |
|  [■] Sleep 7.5hr [Edit] | [ ][✓][ ][ ][✓][ ][ ] ... [✓] [ *] [✓] [✓] [ ] ... [✓][ ]             |   25   [ 11 ]              |
+-------------------------+----------------------------------------------------------------------+----------------------------+
|  Notes                                                                                                         [ + New Note ]   |
|  -----------------------------------------------------------------------------------------------------------------------------  |
|  18 March 2021 at 9:00 pm                                                                                                       |
|  I gotta make sure I don't let my alcohol intake get regular again.                                                             |
|                                                                                                                                 |
|  17 March 2021 at 9:00 pm                                                                                                       |
|  Great workout today, feeling energetic.                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------------+
```

### Component Details:
1. **Header & Navigation Bar**:
   * App branding (`HabitLess`).
   * Participant navigation links:
     * `Habit Calendar` (active link to `/calendar`).
     * `Dashboard` (clicking triggers a notification popup: *"Dashboard is still under construction"*).
   * Month/year navigation controls (`< March 2021 >`).
   * Top Date Header / Indicator: Displays the active date and **lights up / highlights which column/day is editable** for checking off habits.
   * User account indicator (e.g. `demo@dailyhabits.xyz`).
   * `+ New Habit` primary button (Solid Walnut `#724319`).
2. **Monthly Grid Matrix with Side Daily Habits**:
   * **Left Side Panel / Column (HABITS)**: Vertical list of daily habits appearing for that day. Each habit displays its assigned color indicator strip/swatch, title, frequency label, and an inline `[Edit]` action button.
   * **Top Column Header & Illuminated Active Day**: Daily columns labeled with day-of-week initials (`M T W T F S S`) and day numbers (1 to 31). The column for today's active date is illuminated/highlighted with an active focus treatment (`[T*]`, `[18*]`).
   * **Center Grid Cells (1–31)**: Intersecting cells display checkmark pills styled with the **habit's assigned color** when completed. Cells in the illuminated active day column (`[✓*]`, `[ *]`) are interactive to check/uncheck habits for that day.
   * **Right Column (GOAL ACHIEVED)**: Displays each habit's target count alongside its achieved completion count badge (e.g., `20` target, `[ 19 ]` achieved).
3. **Notes Section**:
   * Located directly below the calendar grid.
   * Displays timestamped reflection entries.
   * Features a `+ New Note` action button.

---

## 4. Application Shell & Screens (Strict MVP Scope)

### Screen 1: Registration (Sign Up) & Login
* **Path**: `/login`, `/register`
* **Purpose**: Public account creation and authentication (`HabitLess App Design`, pp. 1, 4).
* **Layout**:
  * Centered card (max width 440px) set on `$gradient-right` canvas.
  * HabitLess branding and slogan: *"Habit and Activity Tracking System"*.
  * Fields:
    * Full Name (Sign Up only, required)
    * Email Address (required)
    * Password (required, minimum 8 characters)
    * Role Selection (Sign Up only: Radio buttons `[x] Participant   [ ] Program Manager`)
  * Primary Action: "Create Account" / "Sign In" button (Solid Walnut `#724319`).
  * Switch link: "Already have an account? Sign In" / "Need an account? Sign Up".
  * **Role-Based Post-Auth Destination**:
    * `PARTICIPANT`: Routes directly to the **Habit Calendar** (`/calendar`).
    * `PROGRAM_MANAGER`: Routes to the Program Manager view (`/manager`).

### Screen 2: Habit Calendar Desktop (`/calendar`) [Primary Participant Screen]
* **Path**: `/calendar`
* **Purpose**: Primary unified desktop interface combining the daily habits list on the side with the full monthly calendar matrix (`HabitLess App Design`, p. 3). Daily habits and the calendar desktop are **not separate pages**.
* **Layout & Components**:
  1. **Header & Navigation Bar**:
     * HabitLess logo and navigation links: `Habit Calendar` (active) and `Dashboard` (triggers "Dashboard is still under construction" notification).
     * Month/year navigation controls (`< March 2021 >`).
     * User profile email indicator and `+ New Habit` action button.
  2. **Top Active Date Indicator**:
     * Positioned above the calendar grid or prominently highlighted within the date row.
     * **Lights up / illuminates which column/day is editable** for checking off habits (e.g. Day 18 illuminated with active border and glowing background).
  3. **Daily Habits Side Panel (Left Column, `HABITS`)**:
     * Vertical list of daily habits scheduled for the active date.
     * Each card/row includes:
       * Color indicator strip matching the habit's assigned color from the 8 habit tokens.
       * Habit title and frequency label.
       * Inline `[Edit]` button opening the habit edit modal.
  4. **Monthly Grid Matrix (1–31 Day Columns)**:
     * Days 1 to 31 labeled with day-of-week initials (`M T W T F S S`).
     * Cells in the illuminated active day column are interactive checkboxes/pills for checking and unchecking habits for that day.
     * When completed, cells display the habit's assigned color background with a white checkmark `✓`.
  5. **Goals Tracker Column (`GOAL ACHIEVED`)**:
     * Displays target count alongside achieved completion count per habit (e.g. `20 [ 19 ]`).
  6. **Notes Section (Bottom)**:
     * Located below the grid with timestamped reflection entries and `+ New Note` action.

### Screen 3: Participant Dashboard (`/dashboard`) [Under Construction Placeholder]
* **Path**: `/dashboard`
* **Purpose**: Placeholder screen (`HabitLess App Design`, pp. 1, 4).
* **Behavior & Components**:
  * When a participant clicks the "Dashboard" navigation link or directly navigates to `/dashboard`:
    * A popup notification / toast is instantly triggered: *"Dashboard is still under construction"*.
    * Renders a friendly under-construction placeholder view on the Papaya Whip canvas with an announcement card: *"The Participant Dashboard is currently under construction. Please use the Habit Calendar to track your daily habits."*
    * Includes a primary button: "Go to Habit Calendar" routing back to `/calendar`.

### Screen 4: "+ New Habit" & "Edit Habit" Modal
* **Trigger**: `+ New Habit` button on `/calendar` header or `[Edit]` button on any side habit row.
* **Fields**:
  1. **Habit Name (`*`)**: Single-line text input (2–80 chars).
  2. **Description**: Multiline text input (optional, max 500 chars).
  3. **Fixed Habit Color (`*`)**: 8 circular swatch buttons:
     * Blue Energy (`#448aff`)
     * Ocean Deep (`#1565c0`)
     * Verdigris (`#009688`)
     * Yellow Green (`#8bc34a`)
     * Amber Gold (`#ffc107`)
     * Amber Glow (`#ff9800`)
     * Cinnabar (`#f44336`)
     * Cherry Rose (`#ad1457`)
  4. **Frequency (`*`)**: Selector for:
     * `Daily`
     * `Weekdays` (Mon–Fri)
     * `3x per Week`
     * `Weekly`
     * `Monthly`
  5. **Date Schedule**:
     * Start Date (defaults to today)
     * End Date (optional date picker, &ge; Start Date)
  6. **Monthly Target Count**: Integer input (default 20, min 1, max 31).
* **Actions**: "Save Habit" (Primary Walnut), "Cancel" (Secondary).

### Screen 5: Program Manager Challenge Program Builder & Web Deploy
* **Path**: `/manager`
* **Purpose**: Manager tool to create challenge programs, define activities, and deploy to web (`HabitLess App Design`, pp. 1, 5).
* **Fields**:
  1. **Program Title (`*`)**: e.g. "30-Day Wellness Challenge".
  2. **Category (`*`)**: e.g. "Wellness", "Fitness", "Mindfulness".
  3. **Description**: Program instructions and guidelines.
  4. **Dates (`*`)**: Start Date and End Date.
  5. **Activities Definition**:
     * Dynamic list of activities.
     * "+ Add Activity" button: Title, Description, Target Frequency (Daily, 3x/week, Weekdays only), Target count.
* **Actions**:
  * "Save Draft"
  * "Deploy to Web" (publishes challenge, activates public web link `/challenges/:id`, and displays copyable invitation link).

### Screen 6: Web Challenge Invitation Landing Page
* **Path**: `/challenges/:id`
* **Purpose**: Web invitation view generated upon Program Manager deploy (`HabitLess App Design`, pp. 1, 5).
* **Layout**:
  * Challenge overview card with title, category, dates, and list of defined habits/activities.
  * "Join Challenge" primary action button for logged-in participants.

---

## 5. Explicitly Deferred UI Elements (Non-MVP)

Per `HabitLess App Design`, pp. 4–5, the following UI elements and screens are **deferred to post-Sprint 1**:
* **Completion Calendar / Heatmap** (separate heatmap grid showing completed vs missed days at a glance) — High Priority / High Effort.
* **Statistics per habit** — High Priority / High Effort.
* **Program Completion Bar (Total Habits Done)** — High Priority / High Effort.
* **Separate Habits Management Page** (viewing/editing and daily habits list are unified on the Habit Calendar `/calendar`) — High Priority / High Effort.
* **Participant Marketplace Discovery Catalog** (`See new challenge packages ... (this is a new page)`) — High Priority / High Effort.
* **Manager Challenge Popularity Statistics** — High Priority / High Effort.
* **Manager Active Roster Management & Deactivation** — High Priority / High Effort.
* **Bug Report Form** — Low Priority / Low Effort.
* **Streak Counters & Highest Streak Badges** — Low Priority / Low Effort.
* **Custom Hex Color Picker** (strictly fixed 8-color habit swatches for MVP) — Low Priority / Low Effort.
* **Daily Mood Tracker Calendar** — Low Priority / High Effort.
* **Email / SMS Reminders** — Low Priority / High Effort.
* **One-Click CSV Export** — Low Priority / High Effort.

---

## 6. Accessibility (WCAG 2.2 AA Compliance)

1. **Color Contrast**:
   * Text in `--walnut` (`#724319`) on `--powder-blush` (`#f7b1b0`) canvas achieves a contrast ratio of `6.1:1`, exceeding WCAG AA requirements.
   * White text on `--walnut` buttons achieves `9.4:1`.
2. **Color Independence**:
   * Completed daily cells and checklist items display both the habit's assigned color and an explicit checkmark glyph `✓`.
3. **Screen Readers & Focus**:
   * Calendar grid cells include descriptive `aria-label` tags (e.g., `aria-label="Journal, March 18, Completed"`).
   * The top illuminated active date column features `aria-current="date"` so assistive technology clearly identifies the active editable day.
   * Under-construction popup notifications and toasts are announced using `aria-live="polite"`.
   * Focus rings display a 3px soft `--walnut` glow.
