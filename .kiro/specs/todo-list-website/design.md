# Design Document — Personal Productivity Dashboard

## Overview

A single-page personal productivity dashboard delivered as three static files with zero dependencies, zero build steps, and zero backend. Everything runs in the browser; all state is persisted to `localStorage`.

The dashboard exposes four independent widgets on one HTML page:

| Widget | Core Responsibility |
|---|---|
| Greeting Widget | Show live clock, date, and a time-of-day greeting |
| Focus Timer | 25-minute Pomodoro countdown with Start / Stop / Reset |
| To-Do List (Task Manager) | Full CRUD on tasks, persisted as JSON in localStorage |
| Quick Links Panel | User-defined shortcut links, persisted as JSON in localStorage |

**Constraints that shape every decision:**
- Exactly one `index.html`, one `css/style.css`, one `js/app.js`
- No npm, no bundler, no transpiler, no framework
- Must run from `file://` or a plain HTTP static server in Chrome, Firefox, Edge, and Safari (latest stable)
- localStorage is the only persistence layer

---

## Architecture

### File Structure

```
project-root/
├── index.html          # Single page; contains all widget markup skeletons
├── css/
│   └── style.css       # All layout, theme, and component styles
└── js/
    └── app.js          # All application logic, organised into modules via IIFE/object pattern
```

### Module Organisation Inside `app.js`

Because there is no bundler, code is organised into self-contained object modules assigned to a single `App` namespace. Each widget owns its own module. A shared `Storage` utility module provides all localStorage access.

```
App
├── Storage          — read/write/parse localStorage
├── GreetingWidget   — clock + date + greeting
├── Timer            — Pomodoro countdown
├── TaskManager      — to-do CRUD + persistence
└── QuickLinks       — link CRUD + persistence
```

Modules are initialised in a single `DOMContentLoaded` listener at the bottom of `app.js`:

```js
document.addEventListener('DOMContentLoaded', () => {
  App.GreetingWidget.init();
  App.Timer.init();
  App.TaskManager.init();
  App.QuickLinks.init();
});
```

### Rendering Strategy

All DOM manipulation is plain vanilla JS (`createElement`, `appendChild`, `textContent`, `classList`). No innerHTML is used to set user-supplied content — this prevents XSS from task descriptions or link labels. Each widget owns a root `<section>` element identified by a stable `id` in the HTML.

### Error Boundary Pattern

Each `init()` function is wrapped in a `try/catch`. If a widget throws during initialisation, the catch block replaces the widget's root element content with a human-readable error message and re-throws nothing (so the other widgets still initialise).

```js
function safeInit(module, id) {
  try {
    module.init();
  } catch (e) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p class="widget-error">Failed to load widget: ${id}</p>`;
  }
}
```

### Responsive Layout Strategy

CSS Grid is used at the dashboard level. Three breakpoint tiers control column count:

| Viewport | Grid columns |
|---|---|
| ≥ 1200 px | `repeat(2, 1fr)` (two rows × two columns, or a 4-column flex variant) |
| 768 px – 1199 px | `repeat(2, 1fr)` |
| < 768 px | `1fr` (single column) |

Each widget `<section>` is a grid item. No widget sets a fixed width; they size to their column.

---

## Components and Interfaces

### 1. Greeting Widget

**DOM root:** `<section id="greeting-widget">`

**Responsibilities:**
- Display live time in `HH:MM` (24-hour) updated every 60 seconds
- Display date in `DayName, D MonthName YYYY`
- Display greeting string: "Good Morning" (05:00–11:59), "Good Afternoon" (12:00–17:59), "Good Evening" (18:00–23:59 and 00:00–04:59)
- Render immediately on `init()`, before the first 60-second tick

**Public interface:**
```js
App.GreetingWidget = {
  init()   // Renders immediately, then starts setInterval(update, 60_000)
  update() // Reads new Date(), updates DOM text nodes
};
```

**Key internal functions:**
```js
function getGreeting(hour)  // Returns "Good Morning" | "Good Afternoon" | "Good Evening"
function formatTime(date)   // Returns "HH:MM" string
function formatDate(date)   // Returns "DayName, D MonthName YYYY" string
```

**Failure mode:** If `new Date()` throws (extremely rare), the widget displays "Time data unavailable."

---

### 2. Focus Timer

**DOM root:** `<section id="focus-timer">`

**Responsibilities:**
- Display countdown in `MM:SS`, starting at `25:00`
- Start — begins `setInterval` ticking every 1 second; disabled when already running or at `00:00`
- Stop — clears the interval, retains current remaining time; disabled when not running
- Reset — clears interval, restores to `25:00`
- Auto-stop and notify when countdown hits `00:00`

**State:**
```js
let remainingSeconds = 1500; // 25 × 60
let intervalId = null;
let isRunning = false;
```

**Public interface:**
```js
App.Timer = {
  init()    // Renders initial display, attaches button listeners
  start()   // Validates state, starts interval
  stop()    // Clears interval, updates button states
  reset()   // Stops + restores to 1500 s
  tick()    // Decrements remainingSeconds, updates display, auto-stops at 0
};
```

**Button state matrix:**

| Timer state | Start | Stop | Reset |
|---|---|---|---|
| Idle (not started) | enabled | disabled | enabled |
| Running | disabled | enabled | enabled |
| Paused | enabled | disabled | enabled |
| Finished (00:00) | disabled | disabled | enabled |

**Session-end notification:** Uses `alert()` as the simplest cross-browser notification. No external library needed.

---

### 3. Task Manager

**DOM root:** `<section id="task-manager">`

**Responsibilities:**
- Input field (max 500 chars) + Add button for creating tasks
- Render task list from localStorage on load
- Per-task controls: completion toggle (checkbox), Edit button, Delete button
- Edit flow: inline replacement of text with an `<input>` pre-filled with current text; confirm via Enter / Save button; cancel via Escape / Cancel button
- Persist full task array to localStorage on every mutation
- Enforce: empty / whitespace-only descriptions are rejected; edit to empty/whitespace is discarded (original text retained)

**Public interface:**
```js
App.TaskManager = {
  init()              // Loads from storage, renders list, attaches input listeners
  addTask(text)       // Validates, creates Task object, saves, re-renders
  editTask(id, text)  // Validates, updates task, saves, re-renders
  deleteTask(id)      // Removes task by id, saves, re-renders
  toggleTask(id)      // Flips done/undone, saves, re-renders
  render()            // Rebuilds the task list DOM from in-memory array
};
```

**Edit mode details:**
- Only one task can be in edit mode at a time. Activating Edit on a second task while another is open cancels the first (discards changes).
- The edit input field is restricted to 500 characters via `maxlength`.
- Escape keydown on the edit input fires cancel.

---

### 4. Quick Links Panel

**DOM root:** `<section id="quick-links">`

**Responsibilities:**
- Label input (max 50 chars) + URL input (max 2048 chars) + Add Link button
- Validate: label non-empty; URL starts with `http://` or `https://`
- Render saved links as buttons; each button opens URL in new tab (`window.open(url, '_blank', 'noopener,noreferrer')`)
- Per-link Delete control
- Cap display at 20 links (first 20 from stored array)
- Persist link array to localStorage on every mutation

**Public interface:**
```js
App.QuickLinks = {
  init()          // Loads from storage, renders buttons
  addLink(label, url)  // Validates, creates Link object, saves, re-renders
  deleteLink(id)  // Removes by id, saves, re-renders
  render()        // Rebuilds link button list from in-memory array
};
```

**URL validation function:**
```js
function isValidUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}
```

Label text is truncated in CSS (`text-overflow: ellipsis`) rather than by slicing the string, so the full label is always stored but displayed at max 50 chars visually.

---

### 5. Storage Utility

**Responsibilities:** Centralise all localStorage access and handle read/write failures without crashing.

```js
App.Storage = {
  get(key, fallback)   // JSON.parse(localStorage.getItem(key)) ?? fallback
  set(key, value)      // localStorage.setItem(key, JSON.stringify(value)); returns true/false
};
```

`get()` wraps parsing in try/catch: if the stored value is not valid JSON, it returns `fallback` (typically `[]`).  
`set()` wraps `setItem` in try/catch: if the write fails (quota exceeded, private browsing, etc.), it returns `false` and the caller is responsible for showing an error message.

**localStorage keys:**

| Key | Widget | Value type |
|---|---|---|
| `dashboard_tasks` | Task Manager | `Task[]` JSON array |
| `dashboard_links` | Quick Links | `Link[]` JSON array |

---

## Data Models

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string} id          - UUID v4 string, generated via crypto.randomUUID()
 * @property {string} text        - Task description, 1–500 characters
 * @property {boolean} done       - Completion status; false = undone, true = done
 * @property {number} createdAt   - Unix timestamp (Date.now()) at creation time
 */
```

Example JSON stored in `dashboard_tasks`:
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "text": "Finish the design document",
    "done": false,
    "createdAt": 1725660000000
  }
]
```

**Invariants:**
- `id` is unique across all tasks in the array
- `text` is never an empty string or whitespace-only string after trimming
- `text.length` ≤ 500
- `done` is strictly a boolean

### Link

```js
/**
 * @typedef {Object} Link
 * @property {string} id        - UUID v4 string
 * @property {string} label     - Display label, 1–50 characters
 * @property {string} url       - Full URL starting with "http://" or "https://", max 2048 chars
 * @property {number} createdAt - Unix timestamp at creation time
 */
```

Example JSON stored in `dashboard_links`:
```json
[
  {
    "id": "f1e2d3c4-b5a6-7890-abcd-123456789abc",
    "label": "GitHub",
    "url": "https://github.com",
    "createdAt": 1725660000000
  }
]
```

**Invariants:**
- `id` is unique across all links in the array
- `label` is never empty; `label.length` ≤ 50
- `url` starts with `http://` or `https://`; `url.length` ≤ 2048
- The array holds at most 20 links (enforced before every `set()` call)

### Timer State (in-memory only, not persisted)

```js
// Internal to App.Timer — not stored in localStorage
{
  remainingSeconds: Number,  // 0–1500
  isRunning: Boolean,
  intervalId: Number | null
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Time format is always valid HH:MM

*For any* `Date` object, `formatTime(date)` must return a string that matches the pattern `HH:MM` where `HH` is a zero-padded integer in `[00, 23]` and `MM` is a zero-padded integer in `[00, 59]`.

**Validates: Requirements 2.1**

---

### Property 2: Date format is always correct

*For any* `Date` object, `formatDate(date)` must return a string of the form `"DayName, D MonthName YYYY"` where `DayName` is the correct full English weekday name for that date, `D` is the day-of-month integer with no leading zero, `MonthName` is the correct full English month name, and `YYYY` is the 4-digit year.

**Validates: Requirements 2.2**

---

### Property 3: Greeting function covers all hours correctly

*For any* integer `hour` in `[0, 23]`, `getGreeting(hour)` must return exactly one of the three greeting strings, and the string must correspond to the correct time range:
- `hour` in `[5, 11]` → `"Good Morning"`
- `hour` in `[12, 17]` → `"Good Afternoon"`
- `hour` in `[0, 4]` or `[18, 23]` → `"Good Evening"`

No `hour` in `[0, 23]` may produce an undefined, null, or incorrect greeting.

**Validates: Requirements 2.3, 2.4, 2.5**

---

### Property 4: Timer tick always decrements by exactly one second

*For any* timer state where `remainingSeconds > 0` and the timer is running, a single call to `tick()` must decrease `remainingSeconds` by exactly `1` and update the display to reflect the new value.

**Validates: Requirements 3.2, 3.3**

---

### Property 5: Timer display format is always valid MM:SS

*For any* integer `n` in `[0, 1500]`, `formatTimerDisplay(n)` must return a string matching `/^\d{2}:\d{2}$/` where the minutes portion equals `Math.floor(n / 60)` zero-padded to 2 digits and the seconds portion equals `n % 60` zero-padded to 2 digits.

**Validates: Requirements 3.3**

---

### Property 6: Reset always restores canonical initial state

*For any* timer state (running, paused, at any `remainingSeconds` value including `0`), calling `reset()` must result in `remainingSeconds === 1500`, `isRunning === false`, and the display showing `"25:00"`.

**Validates: Requirements 3.5**

---

### Property 7: Timer button-state invariant

*For any* timer state:
- When `isRunning === true`: the Start button must be disabled and the Stop button must be enabled.
- When `isRunning === false` and `remainingSeconds === 0`: both Start and Stop buttons must be disabled.
- When `isRunning === false` and `remainingSeconds > 0`: the Start button must be enabled and the Stop button must be disabled.

**Validates: Requirements 3.7, 3.9**

---

### Property 8: Valid task addition is a round-trip

*For any* string `text` with `text.trim().length` in `[1, 500]`, calling `addTask(text)` must:
1. Increase the in-memory task list length by exactly `1`
2. Set the new task's `text` field to `text.trim()`
3. Set the new task's `done` field to `false`
4. Write the updated array to `localStorage` such that `Storage.get('dashboard_tasks')` includes the new task

**Validates: Requirements 4.2, 4.5, 7.3**

---

### Property 9: Whitespace-only task input is always rejected

*For any* string `text` where every character is a whitespace character (i.e., `text.trim() === ""`), calling `addTask(text)` must not increase the task list length, must not write a new task to `localStorage`, and must retain the current task list state unchanged.

**Validates: Requirements 4.3**

---

### Property 10: Input field is cleared after any successful task addition

*For any* valid task text, after `addTask(text)` completes successfully, the text input element's `.value` must be an empty string `""`.

**Validates: Requirements 4.7**

---

### Property 11: Confirmed edit trims whitespace and persists

*For any* existing task and *any* edit input string `newText` where `newText.trim().length >= 1` and `newText.trim().length <= 500`, confirming the edit must:
1. Update the task's `text` to `newText.trim()`
2. Return the task to display mode
3. Write the updated array to `localStorage` so that `Storage.get('dashboard_tasks')` reflects the trimmed text

**Validates: Requirements 5.3, 5.6**

---

### Property 12: Whitespace-only edit is always rejected — original text preserved

*For any* existing task with text `T` and *any* edit input string where `newText.trim() === ""`, confirming the edit must leave the task's `text` equal to `T` (unchanged), return the task to display mode, and not write a different value to storage.

**Validates: Requirements 5.4**

---

### Property 13: Completion toggle is a round-trip (idempotent over two toggles)

*For any* task with completion status `S`, toggling it twice must return the task to status `S`. Specifically, a single toggle must strictly flip `done`: undone → done and done → undone.

**Validates: Requirements 6.2, 6.3**

---

### Property 14: Delete removes exactly the targeted task — others unchanged

*For any* task list of length `N >= 1` and *any* task `T` in the list, calling `deleteTask(T.id)` must:
1. Reduce list length to `N - 1`
2. Leave all remaining tasks with `id !== T.id` with their `text` and `done` fields unchanged
3. Result in `Storage.get('dashboard_tasks')` no longer containing any task with `id === T.id`

**Validates: Requirements 6.5, 7.3**

---

### Property 15: Task list load is a round-trip from localStorage

*For any* valid array of `Task` objects written to `localStorage` under key `dashboard_tasks`, after calling `TaskManager.init()`, the rendered task list must contain the same number of tasks and each task must have equivalent `id`, `text`, and `done` values as the stored object.

**Validates: Requirements 7.1, 7.5**

---

### Property 16: Quick Links 20-link cap is always enforced

*For any* link array of length `L`, after `QuickLinks.render()`, the number of rendered link buttons must equal `Math.min(L, 20)`. When `L > 20`, only the first 20 links (by array order) are displayed.

**Validates: Requirements 8.5, 9.8**

---

### Property 17: Valid link addition is a round-trip

*For any* non-empty `label` with `label.length <= 50` and *any* `url` that starts with `"http://"` or `"https://"` and has `url.length <= 2048`, calling `addLink(label, url)` when the current link count is less than 20 must:
1. Increase the link count by exactly `1`
2. Store the new link with the provided `label` and `url`
3. Write the updated array to `localStorage` so that `Storage.get('dashboard_links')` includes the new link

**Validates: Requirements 9.2, 9.6**

---

### Property 18: Invalid link input is always rejected

*For any* combination where `label.trim() === ""` or `url` does not start with `"http://"` or `"https://"`, calling `addLink(label, url)` must not increase the link count and must not modify `localStorage`.

**Validates: Requirements 9.3**

---

### Property 19: Link deletion removes exactly the targeted link — others unchanged

*For any* link list of length `N >= 1` and *any* link `L` in the list, calling `deleteLink(L.id)` must:
1. Reduce list length to `N - 1`
2. Leave all remaining links with `id !== L.id` with their `label` and `url` fields unchanged
3. Result in `Storage.get('dashboard_links')` no longer containing any link with `id === L.id`

**Validates: Requirements 9.5, 9.6**

---

### Property 20: Quick Links load is a round-trip from localStorage

*For any* valid array of `Link` objects written to `localStorage` under key `dashboard_links`, after calling `QuickLinks.init()`, the number of rendered buttons must equal `Math.min(links.length, 20)` and each rendered button's accessible label must match the corresponding link's `label` field.

**Validates: Requirements 8.1, 10.2**

---

## Error Handling

Every interaction with localStorage or the DOM that can fail has an explicit failure path. The failure modes and their handling are:

### localStorage Failures

| Failure | Trigger | Handling |
|---|---|---|
| `StorageError` on write (quota, private browsing) | `Storage.set()` returns `false` | Widget shows inline error message near the relevant input/list; in-memory state is unchanged so the UI remains consistent |
| Corrupted / non-JSON data on read | `JSON.parse` throws | `Storage.get()` catches, logs to console, returns the provided `fallback` (always `[]`) |
| `localStorage` inaccessible on read | `localStorage.getItem` throws | Same catch as above; returns `fallback` |

### Widget Initialisation Failures

Each widget's `init()` is wrapped in the `safeInit` function. If any uncaught exception reaches `safeInit`, the widget's root `<section>` is replaced with:

```html
<p class="widget-error">Failed to load widget: [widget-name]</p>
```

This ensures one broken widget never prevents the other three from loading.

### Timer Edge Cases

| Situation | Handling |
|---|---|
| `start()` called when `remainingSeconds === 0` | Function returns early without starting interval |
| `start()` called when already running | Function returns early (no duplicate interval) |
| `stop()` called when not running | Function returns early (no-op) |

### Greeting Widget Failure

If `new Date()` throws (device clock unavailable), the widget catches the error and renders:

```
Time data unavailable.
```

### Quick Links URL Validation

Validation runs client-side before any DOM update or localStorage write. Invalid input surfaces as an inline error message adjacent to the offending field. The error message is removed on the next successful submission.

---

## Testing Strategy

### Overview

This project has no build tool or test framework included by default. All testing uses plain browser developer tools, manual verification, and — for functional logic — lightweight unit tests runnable in a browser console or a minimal HTML test harness using **[Jasmine](https://jasmine.github.io/)** (CDN-loaded, no npm required).

For property-based testing, **[fast-check](https://fast-check.dev/)** is used, also loaded from CDN, requiring no build step.

```html
<!-- test/index.html — a standalone test runner, not part of the production files -->
<script src="https://cdn.jsdelivr.net/npm/jasmine-core@5/lib/jasmine-core/jasmine.js"></script>
<script src="https://cdn.jsdelivr.net/npm/fast-check@3/lib/bundle/fast-check.js"></script>
<script src="../js/app.js"></script>
<script src="tests.js"></script>
```

This keeps the test harness completely separate from the three required production files.

### Unit Tests (Example-Based)

Focused on specific scenarios, edge cases, and interaction events that are not covered by properties:

| Area | Test Cases |
|---|---|
| GreetingWidget | Displays immediately on init; handles Date failure gracefully |
| Timer | Initial display is "25:00"; Start → Stop retains time; auto-stop and notification at 00:00; Start ignored when at 00:00 |
| TaskManager | Empty input rejected; Escape cancels edit; Delete control renders per task; empty localStorage shows empty list; corrupted localStorage shows empty list |
| QuickLinks | Missing localStorage shows empty panel; window.open called with correct args on link click; error shown when write fails |
| Storage | `get()` returns fallback for invalid JSON; `set()` returns false on quota error |

### Property-Based Tests

Each property test uses fast-check with a minimum of **100 iterations**. Each test is tagged with the property it validates.

```js
// Feature: todo-list-website, Property 1: Time format is always valid HH:MM
fc.assert(fc.property(fc.date(), (date) => {
  const result = App.GreetingWidget._formatTime(date);
  return /^[0-2]\d:[0-5]\d$/.test(result) &&
         parseInt(result.slice(0, 2)) <= 23;
}), { numRuns: 100 });
```

| Property | fast-check Generators |
|---|---|
| Property 1: formatTime | `fc.date()` |
| Property 2: formatDate | `fc.date()` |
| Property 3: getGreeting | `fc.integer({ min: 0, max: 23 })` |
| Property 4: tick decrements | `fc.integer({ min: 1, max: 1500 })` for starting seconds |
| Property 5: formatTimerDisplay | `fc.integer({ min: 0, max: 1500 })` |
| Property 6: reset restores state | `fc.record({ remainingSeconds: fc.integer({min:0, max:1500}), isRunning: fc.boolean() })` |
| Property 7: button state invariant | Same record generator as Property 6 |
| Property 8: valid task addition | `fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0)` |
| Property 9: whitespace input rejected | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| Property 10: input cleared after add | Same as Property 8 |
| Property 11: edit trims and persists | `fc.tuple(validTaskGen, fc.string().filter(s => s.trim().length > 0))` |
| Property 12: whitespace edit rejected | `fc.tuple(validTaskGen, fc.stringOf(fc.constantFrom(' ', '\t', '\n')))` |
| Property 13: toggle round-trip | `fc.boolean()` for initial done state |
| Property 14: delete removes exactly one | `fc.array(taskGen, { minLength: 1 })` + `fc.nat()` for index |
| Property 15: task load round-trip | `fc.array(taskGen, { maxLength: 50 })` |
| Property 16: 20-link cap | `fc.array(linkGen, { minLength: 0, maxLength: 40 })` |
| Property 17: valid link addition | `fc.tuple(labelGen, urlGen)` |
| Property 18: invalid link rejected | `fc.tuple(fc.string(), fc.string().filter(s => !s.startsWith('http')))` |
| Property 19: delete link removes exactly one | `fc.array(linkGen, { minLength: 1 })` + index |
| Property 20: link load round-trip | `fc.array(linkGen, { maxLength: 25 })` |

### Visual and Manual Verification

These requirements are verified by manual inspection:

- **Responsive layout** (Requirement 11.3, 11.4, 11.6): Resize DevTools viewport through breakpoints
- **Font sizes and contrast** (Requirement 11.2, 11.5): Use DevTools Accessibility panel for contrast ratios
- **Cross-browser compatibility** (Requirement 1.3): Open in Chrome, Firefox, Edge, Safari
- **Performance** (Requirement 12.1–12.5): DevTools Performance panel; check main-thread blocking with a task list of 500 entries

### localStorage Mock Pattern

Tests that need to exercise storage failures use a simple mock:

```js
const originalSet = localStorage.setItem.bind(localStorage);
localStorage.setItem = () => { throw new DOMException('QuotaExceededError'); };
// ... run test ...
localStorage.setItem = originalSet;
```
