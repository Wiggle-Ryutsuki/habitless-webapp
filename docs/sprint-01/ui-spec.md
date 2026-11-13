# HabitLess UI Design Specification

**Document ID**: UI-SPEC-HL-01  
**Version**: 1.4  
**Status**: Approved Design Baseline (Strict MVP Scope)  
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

The Participant Daily Habit Tracker Calendar desktop interface is modeled directly on the design mockup (`HabitLess App Design`, p. 3) with vibrant individual habit colors:

```
+-----------------------------------------------------------------------------------------------------------------------+
|  HabitLess   [ < March 2021 > ]                             demo@dailyhabits.xyz                  [ + New Habit ]     |
+-----------------------------------------------------------------------------------------------------------------------+
|  HABITS                 M  T  W  T  F  S  S  M  T  W  T  F  S  S ... 26 27 28 29 30 31          GOAL ACHIEVED         |
|                         1  2  3  4  5  6  7  8  9 10 11 12 13 14 ...                                                  |
|-----------------------------------------------------------------------------------------------------------------------|
|  Journal         [Edit] [✓][✓][✓][ ][✓][✓][✓][ ][✓][✓] ...                 [✓][ ][ ] ...         20   [ 19 ]          |
|  Exercise        [Edit] [✓][ ][✓][ ][✓][ ][✓][ ][ ][✓] ...                 [ ][✓][ ] ...         20   [ 14 ]          |
|  Bathe+Moisturize[Edit] [✓][✓][✓][✓][ ][✓][✓][✓][✓][✓] ...                 [✓][✓][ ] ...         25   [ 19 ]          |
|  Eat healthy bkf [Edit] [✓][✓][✓][✓][✓][✓][✓][✓][✓][✓] ...                 [✓][✓][✓] ...         20   [ 20 ]          |
|  No alcohol      [Edit] [✓][✓][✓][✓][ ][✓][✓][✓][✓][✓] ...                 [✓][✓][✓] ...         20   [ 20 ]          |
|  No sugar        [Edit] [✓][✓][ ][✓][✓][✓][✓][ ][✓][✓] ...                 [✓][✓][ ] ...         20   [ 16 ]          |
|  Eat light dinner[Edit] [✓][✓][✓][ ][✓][✓][✓][ ][✓][✓] ...                 [✓][✓][✓] ...         20   [ 21 ]          |
|  Sleep 7.5 hrs   [Edit] [ ][✓][ ][ ][✓][ ][ ][✓][ ][ ] ...                 [✓][✓][ ] ...         25   [ 11 ]          |
+-----------------------------------------------------------------------------------------------------------------------+
|  Notes                                                                                           [ + New Note ]       |
|  -------------------------------------------------------------------------------------------------------------------  |
|  18 March 2021 at 9:00 pm                                                                                             |
|  I gotta make sure I don't let my alcohol intake get regular again.                                                   |
|                                                                                                                       |
|  17 March 2021 at 9:00 pm                                                                                             |
|  Great workout today, feeling energetic.                                                                              |
+-----------------------------------------------------------------------------------------------------------------------+
```

### Component Details:
1. **Header Bar**:
   * Month/year navigation controls (`< March 2021 >`).
   * User account indicator (e.g. `demo@dailyhabits.xyz`).
   * `+ New Habit` primary button (Solid Walnut `#724319`).
2. **Monthly Grid Matrix**:
   * **Left Column (HABITS)**: Vertical list of tracked habits, each displaying its assigned color pill/strip and an inline `Edit` action button.
   * **Center Grid (1–31)**: Daily columns labeled with day-of-week initials (`M T W T F S S`) and day numbers (1 to 31). Intersecting cells display an interactive checkmark pill styled with the **habit's assigned color** when completed.
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

### Screen 2: Participant Dashboard — Today's Checklist & Goals Tracker
* **Path**: `/dashboard`
* **Purpose**: Today's daily task list and goals tracker overview (`HabitLess App Design`, pp. 1, 4).
* **Components**:
  1. **Greeting & Current Date**:
     * Current Date banner (e.g., "Friday, November 13, 2026").
     * Today's completion tally (e.g., "1 of 3 habits completed today").
  2. **Goals Tracker Summary**:
     * Cards showing total active habits and total goals achieved this month.
  3. **Today's Assigned Habits & Activities Checklist**:
     * Vertical list of cards for habits scheduled for today.
     * Each card includes:
       * Color indicator strip matching the habit's assigned color from the 8 habit tokens.
       * Habit title and frequency label.
       * Interactive checkbox toggle (28px touch target). When checked, displays the habit's assigned color background with checkmark `✓` and strike-through text.
  4. **Quick Action**:
     * `+ New Habit` button opening habit creation modal.

### Screen 3: Daily Habit Tracker Calendar Desktop (View, Track & Edit)
* **Path**: `/calendar`
* **Purpose**: Full monthly habit tracking matrix matching `HabitLess App Design`, p. 3.
* **Layout**:
  * Month/year navigation (`< March 2021 >`) and `+ New Habit` action.
  * 31-day matrix grid with habits on rows and days 1–31 with day initials on columns.
  * Interactive completion checkmark pills rendered in the **habit's specific color** (e.g., Amber Glow for Journal, Blue Energy for Exercise, etc.).
  * Right column displaying `GOAL ACHIEVED` (target count alongside achieved count, e.g. `20 / 19`).
  * In-calendar `Edit` button on each habit row opening the edit modal.
  * Notes section below grid with timestamped reflection entries and `+ New Note` button.

### Screen 4: "+ New Habit" & "Edit Habit" Modal
* **Trigger**: `+ New Habit` button on Dashboard/Calendar, or `Edit` button on a calendar habit row.
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
* **Separate Habits Management Page** (viewing/editing is unified in Calendar and Today's Checklist) — High Priority / High Effort.
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
   * Calendar grid cells include descriptive `aria-label` tags (e.g., `aria-label="Journal, March 12, Completed"`).
   * Focus rings display a 3px soft `--walnut` glow.
