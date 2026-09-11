# Implementation Plan: Personal Productivity Dashboard

## Overview

Build a single-page productivity dashboard as three static files (`index.html`, `css/style.css`, `js/app.js`) with no framework, no build tool, and no backend. All state is persisted to `localStorage`. Four independent widgets — Greeting, Timer, Task Manager, Quick Links — are implemented as modules under a single `App` namespace. A separate `test/` directory holds the Jasmine + fast-check test harness loaded from CDN. The final result is a modern, polished, professional-grade single-page app.

---

## Tasks

- [x] 0. Challenge features (ThemeToggle + NameSetup)
  - [x] 0.1 Implement `App.ThemeToggle` — light/dark mode with localStorage persistence
    - Toggle `data-theme` attribute on `<html>`; persist choice under key `dashboard_theme`
    - Wire `#theme-toggle` button; update icon and `aria-label` on each toggle
    - Apply dark-mode CSS tokens under `[data-theme="dark"]` selector
  - [x] 0.2 Implement `App.NameSetup` — first-visit name modal
    - Show `#name-modal` only when `dashboard_user_name` key is absent from localStorage
    - Save trimmed name (max 40 chars) or empty string (Skip); close modal after either action
    - Expose `getName()` for use by `App.GreetingWidget`
  - [x] 0.3 Add top bar HTML (`#top-bar`) and name-modal HTML to `index.html`
    - Top bar: site title + `#theme-toggle` button
    - Modal: `role="dialog"`, `aria-modal="true"`, name input, Save + Skip buttons, inline error `<p>`

- [x] 1. Scaffold project structure and HTML skeleton
  - [x] 1.1 Create the three required production files: `index.html`, `css/style.css`, `js/app.js`
    - Create the directory `css/` and `js/` alongside `index.html`
    - `index.html` must link to `css/style.css` in `<head>` and `js/app.js` before `</body>`
    - _Requirements: 1.4_
  - [x] 1.2 Add the four widget `<section>` skeletons in `index.html`
    - Add `<section id="greeting-widget">`, `<section id="focus-timer">`, `<section id="task-manager">`, `<section id="quick-links">` inside a `<main>` wrapper
    - Each section must have a visible `<h2>` widget title and an inner container for dynamic content
    - _Requirements: 1.1, 11.2_
  - [x] 1.3 Set up the `App` namespace and `DOMContentLoaded` initialisation entry point in `app.js`
    - Declare `const App = {};` at the top of `app.js`
    - Add the `safeInit` error boundary helper function
    - Add the `DOMContentLoaded` listener calling `safeInit` for each of the four modules
    - _Requirements: 1.2, 1.5_

- [x] 2. CSS theme, layout, and responsive grid
  - [x] 2.1 Define CSS custom properties (design tokens) and base reset
    - Declare `--font-family`, `--color-*`, `--spacing-*`, `--border-radius`, `--font-size-body` (≥ 14px), `--font-size-title` (≥ 18px) variables on `:root`
    - Apply a minimal reset (`box-sizing: border-box`, `margin: 0`, `padding: 0`)
    - _Requirements: 11.1, 11.2_
  - [x] 2.2 Implement the three-breakpoint CSS Grid dashboard layout
    - Default (< 768px): `grid-template-columns: 1fr` (single column, full-width widgets)
    - 768px – 1199px: `grid-template-columns: repeat(2, 1fr)`
    - ≥ 1200px: `grid-template-columns: repeat(2, 1fr)` (two rows × two columns)
    - Each widget `<section>` must have `min-width: 280px`
    - _Requirements: 11.3, 11.4, 11.6_
  - [x] 2.3 Write widget card styles (background, border-radius, spacing, title typography)
    - Apply consistent `padding`, `border-radius`, and `background` from design tokens to all widget sections
    - Title elements: `font-size` ≥ `--font-size-body + 4px`, `font-weight` ≥ 600, contrast ratio ≥ 4.5:1
    - _Requirements: 11.1, 11.2, 11.5_
  - [x] 2.4 Write interactive element styles: buttons, inputs, checkboxes, error messages
    - Style Add, Edit, Delete, Save, Cancel, Start, Stop, Reset buttons consistently
    - Style `.widget-error` class for inline error message display
    - _Requirements: 11.1_

- [x] 3. Storage utility module
  - [x] 3.1 Implement `App.Storage.get(key, fallback)` and `App.Storage.set(key, value)`
    - `get`: wraps `JSON.parse(localStorage.getItem(key))` in `try/catch`; returns `fallback` on any error or null result
    - `set`: wraps `localStorage.setItem(key, JSON.stringify(value))` in `try/catch`; returns `true` on success, `false` on failure
    - _Requirements: 7.4, 12.3, 12.4_
  - [x] 3.2 Write unit tests for `App.Storage`
    - Test `get()` returns `fallback` for invalid JSON, missing key, and inaccessible storage
    - Test `set()` returns `false` when `localStorage.setItem` throws (use quota-exceeded mock)
    - _Requirements: 7.4, 12.4_

- [x] 4. Greeting Widget
  - [x] 4.1 Implement `App.GreetingWidget` with `init()`, `update()`, `updateName()`, `_formatTime(date)`, `_formatDate(date)`, `_getGreeting(hour)`
    - `_formatTime`: return `HH:MM` string (zero-padded, 24-hour)
    - `_formatDate`: return `"DayName, D MonthName YYYY"` using locale-independent arrays for day/month names
    - `_getGreeting`: return correct string for hours 0–23 per the three ranges
    - `init`: call `update()` immediately, then `setInterval(update, 60_000)`; wrap in `try/catch` to render "Time data unavailable." on failure
    - `update`: call `new Date()`, update DOM text nodes (no `innerHTML`); incorporate user name from `App.NameSetup.getName()` when available
    - `updateName(name)`: called by `App.NameSetup` after save to refresh greeting text without reinitialising
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [x] 4.2 Write property test for `_formatTime` (Property 1)
    - **Property 1: Time format is always valid HH:MM**
    - **Validates: Requirements 2.1**
    - Use `fc.date()` generator, assert result matches `/^[0-2]\d:[0-5]\d$/` and hours ≤ 23
  - [x] 4.3 Write property test for `_formatDate` (Property 2)
    - **Property 2: Date format is always correct**
    - **Validates: Requirements 2.2**
    - Use `fc.date()`, assert result matches `"DayName, D MonthName YYYY"` structure
  - [x] 4.4 Write property test for `_getGreeting` (Property 3)
    - **Property 3: Greeting function covers all hours correctly**
    - **Validates: Requirements 2.3, 2.4, 2.5**
    - Use `fc.integer({ min: 0, max: 23 })`, assert correct greeting string for all 24 values
  - [x] 4.5 Write unit tests for Greeting Widget
    - Test that `init()` renders content immediately without waiting for the 60-second tick
    - Test that a `Date` failure causes the "Time data unavailable." message to appear
    - _Requirements: 2.6, 2.7_

- [x] 5. Focus Timer
  - [x] 5.1 Implement `App.Timer` module with `init()`, `start()`, `stop()`, `reset()`, `tick()`, and `_formatDisplay(seconds)`
    - `init`: render initial display, attach event listeners to Start, Stop, Reset buttons; load saved duration from `timer_duration_minutes` (default 25, range 1–60)
    - `_formatDisplay(n)`: return `MM:SS` string for integer `n` in `[0, totalSeconds]` (zero-padded)
    - `start`: validate `!isRunning && remainingSeconds > 0`; set `isRunning = true`, start `setInterval(tick, 1000)`, update button states
    - `stop`: clear interval, set `isRunning = false`, update button states
    - `reset`: call `stop()`, set `remainingSeconds = totalSeconds`, update display and button states
    - `tick`: decrement `remainingSeconds`; update display; if `remainingSeconds === 0` call `stop()` then `alert("Focus session complete!")`
    - Enforce button state matrix (Start/Stop/Reset disabled/enabled per state)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
  - [x] 5.2 Write property test for `_formatDisplay` (Property 5)
    - **Property 5: Timer display format is always valid MM:SS**
    - **Validates: Requirements 3.3**
    - Use `fc.integer({ min: 0, max: 1500 })`, assert output matches `/^\d{2}:\d{2}$/` with correct minute/second values
  - [x] 5.3 Write property test for `tick()` decrement (Property 4)
    - **Property 4: Timer tick always decrements by exactly one second**
    - **Validates: Requirements 3.2, 3.3**
    - Use reset() + warm-up ticks to reach known state; assert display after one tick matches `_formatDisplay(n - 1)`
  - [x] 5.4 Write property test for `reset()` (Property 6)
    - **Property 6: Reset always restores canonical initial state**
    - **Validates: Requirements 3.5**
    - Drive timer into various states via public API; call `reset()`; assert display `"25:00"`, Start enabled, Stop disabled
  - [x] 5.5 Write property test for button state invariant (Property 7)
    - **Property 7: Timer button-state invariant**
    - **Validates: Requirements 3.7, 3.9**
    - For all timer state combinations, assert Start/Stop disabled/enabled states match the button state matrix
  - [x] 5.6 Write unit tests for Focus Timer
    - Test initial display is `"25:00"`
    - Test Start → Stop retains elapsed time
    - Test auto-stop and `alert` notification at `00:00`
    - Test Start is ignored when `remainingSeconds === 0`
    - _Requirements: 3.1, 3.6, 3.8_

- [x] 6. Task Manager — core implementation
  - [x] 6.1 Implement `App.TaskManager.init()` — load and render tasks from localStorage
    - Call `App.Storage.get('dashboard_tasks', [])` to load tasks
    - Validate the result is an array; if not, use `[]`
    - Call `render()` to build the DOM task list
    - Attach event listener to Add button and input field (Enter key)
    - _Requirements: 7.1, 7.2, 7.4_
  - [x] 6.2 Implement `App.TaskManager.addTask(text)` — validation, Task object creation, persistence
    - Trim input; reject if `trim().length === 0` (retain focus on input)
    - Create Task: `{ id: crypto.randomUUID(), text: text.trim(), done: false, createdAt: Date.now() }`
    - Push to in-memory array, call `_save()`, call `render()`, clear input field
    - If `_save()` returns `false`, show inline error; remove task from in-memory array; re-render
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [x] 6.3 Implement `App.TaskManager.render()` — build task list DOM from in-memory array
    - Clear the task list container; iterate tasks array; for each task create: checkbox, text `<span>`, Edit button, Delete button
    - Apply strikethrough style to `<span>` when `task.done === true`
    - Attach event handlers for toggle, edit, delete inline (no `innerHTML` for user content)
    - Respect active filter (All / Active / Completed) when rendering
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 6.4 Implement `App.TaskManager.toggleTask(id)` — flip done/undone and persist
    - Find task by id, flip `done`, call `_save()`, call `render()`
    - If `_save()` returns `false`, revert the flip and show inline error
    - _Requirements: 6.2, 6.3, 6.6, 6.7_
  - [x] 6.5 Implement `App.TaskManager.deleteTask(id)` — remove task and persist
    - Filter task out of in-memory array, call `_save()`, call `render()`
    - If `_save()` returns `false`, restore task in array, re-render, show inline error
    - _Requirements: 6.5, 6.6, 6.7_
  - [x] 6.6 Implement `App.TaskManager.editTask(id, text)` and inline edit mode UI
    - `editTask`: trim `text`; if empty, discard edit, restore original text, return to display mode; else update task text, call `_save()`, call `render()`
    - Inline edit UI: replace text `<span>` with `<input maxlength="500">` pre-filled with current text; add Save and Cancel buttons; bind Enter → save, Escape → cancel
    - Only one task in edit mode at a time: activating Edit on a second task cancels the first (discard changes)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 6.7 Implement `App.TaskManager._save()` — write full task array to localStorage
    - Call `App.Storage.set('dashboard_tasks', tasks)`; return the boolean result
    - _Requirements: 4.5, 7.3, 12.3_
  - [x] 6.8 Implement filter/sort bar — All / Active / Completed tabs + task count badge
    - Render three tab buttons above the task list; clicking a tab sets `activeFilter` and calls `render()`
    - Show a count badge next to the active tab (e.g., "Active (3)")
    - `render()` slices the display based on `activeFilter` without mutating the source array
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 6.9 Implement drag-to-reorder for tasks
    - Add `draggable="true"` to each task item element in `render()`
    - Implement `dragstart`, `dragover`, `drop` handlers; update in-memory array order on drop
    - Call `_save()` after successful drop to persist the new order
    - _Requirements: 7.3_

- [ ] 7. Checkpoint — ensure Task Manager renders, CRUD works, filters work, and localStorage persists across page reloads
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Quick Links Panel — core implementation
  - [ ] 8.1 Implement `App.QuickLinks.init()` — load and render links from localStorage
    - Call `App.Storage.get('dashboard_links', [])` to load links
    - Validate the result is an array; if not (or on error), render empty panel with error message
    - Call `render()` to build link buttons
    - Attach event listeners to label input, URL input, and Add Link button
    - _Requirements: 8.1, 8.3, 8.4, 10.2, 10.3_
  - [ ] 8.2 Implement `App.QuickLinks.addLink(label, url)` — validation, Link object creation, persistence
    - Validate: `label.trim().length >= 1` and `url.startsWith('http://') || url.startsWith('https://')`
    - If validation fails, show inline error message identifying which field is invalid; do not create link
    - Enforce 20-link cap: if current count is already 20, do not add and show error
    - Create Link: `{ id: crypto.randomUUID(), label: label.trim(), url, createdAt: Date.now() }`
    - Push to in-memory array, call `_save()`, call `render()`; if `_save()` returns `false`, revert and show error
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7, 10.1_
  - [ ] 8.3 Implement `App.QuickLinks.deleteLink(id)` — remove link and persist
    - Filter link out of in-memory array, call `_save()`, call `render()`
    - If `_save()` returns `false`, restore link, re-render, show inline error
    - _Requirements: 9.4, 9.5, 9.6, 9.7, 10.1_
  - [ ] 8.4 Implement `App.QuickLinks.render()` — build link button grid from in-memory array
    - Slice in-memory array to first 20 entries before rendering
    - For each link, create a `<button>` with `textContent = link.label` that calls `window.open(url, '_blank', 'noopener,noreferrer')` on click
    - Add a Delete control per link button
    - Label truncation via CSS `text-overflow: ellipsis` (do not slice the stored string)
    - Render buttons inside a CSS Grid container (`.links-grid`) with `repeat(auto-fill, minmax(120px, 1fr))`
    - _Requirements: 8.1, 8.2, 8.5, 9.8_
  - [ ] 8.5 Implement `App.QuickLinks._save()` — write full link array to localStorage
    - Enforce 20-link cap by slicing to 20 before writing
    - Call `App.Storage.set('dashboard_links', links.slice(0, 20))`; return boolean result
    - _Requirements: 9.6, 10.1, 12.3_
  - [ ] 8.6 Implement `Ctrl/Cmd + K` keyboard shortcut — focus URL input and scroll to widget
    - Listen for `keydown` on `document`; check `(e.ctrlKey || e.metaKey) && e.key === 'k'`
    - `preventDefault()`, scroll `#quick-links` into view, focus the URL input field
    - _Requirements: 1.2_

- [ ] 9. Checkpoint — ensure Quick Links renders, add/delete works, 20-cap enforced, grid layout correct, and localStorage persists across reloads
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Polish & Production Quality
  - [ ] 10.1 Add Google Fonts (`Inter`) and update font token
    - Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link>` for `Inter:wght@400;500;600;700` in `<head>` of `index.html`
    - Update `--font-family` token in `style.css` to list `'Inter'` first
    - _Requirements: 11.1_
  - [ ] 10.2 Add SEO meta tags, Open Graph tags, theme-color, and emoji favicon
    - Add `<meta name="description" content="...">`, `<meta name="theme-color" content="#3b5bdb">`
    - Add Open Graph tags: `og:title`, `og:description`, `og:type`
    - Add `<link rel="icon">` using an SVG data-URI emoji (📋) as the favicon
    - _Requirements: 1.3_
  - [ ] 10.3 Accessibility pass — ARIA roles, live regions, and label associations
    - Add `role="region"` and `aria-label` to all four `<section>` widgets
    - Add `aria-live="polite"` containers for task list and quick-links error areas
    - Ensure all `<input>` elements have associated `<label>` elements (via `for`/`id` or `aria-label`)
    - Verify all interactive elements have visible `:focus-visible` styles
    - _Requirements: 11.5_
  - [ ] 10.4 Greeting widget visual upgrade — hero typography
    - In `style.css`: style `.greeting-text` at `font-size: 1.75rem; font-weight: 700`
    - Style `.greeting-time` at `font-size: 3rem; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -1px`
    - Style `.greeting-date` at `font-size: var(--font-size-body); color: var(--color-text-muted)`
    - _Requirements: 11.2_
  - [ ] 10.5 Timer SVG progress ring
    - In `index.html` (built by `App.Timer.init()`): render an `<svg>` with two `<circle>` elements — track and progress ring — using `stroke-dasharray` / `stroke-dashoffset`
    - In `app.js`: update `stroke-dashoffset` on each `tick()` call proportional to `remainingSeconds / totalSeconds`
    - In `style.css`: add `.timer-ring` styles — ring color uses `--color-primary`, track uses `--color-border`
    - _Requirements: 3.3_
  - [ ] 10.6 Micro-animations — fade-in-up for widget content, card hover lift
    - Add `@keyframes fadeInUp` in `style.css` (`opacity: 0, translateY(8px)` → `opacity: 1, translateY(0)`)
    - Apply `animation: fadeInUp 0.35s ease forwards` to `.widget-content > *` with staggered `animation-delay` (nth-child × 0.05s)
    - Add `transition: transform 0.2s ease, box-shadow 0.2s ease` and `:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }` to `#dashboard > section`
    - Use `will-change: transform` on widget cards to hint the GPU
    - _Requirements: 11.1_
  - [ ] 10.7 Scrollable task list with custom scrollbar
    - In `style.css`: add `.task-list` styles — `max-height: 320px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--color-border) transparent`
    - Add `::-webkit-scrollbar` styles for Chromium: `width: 6px`, track transparent, thumb `var(--color-border)`
    - In `app.js`: wrap the task item container in a `<div class="task-list">` inside `render()`
    - _Requirements: 6.1_
  - [ ] 10.8 Quick links grid layout in CSS
    - Add `.links-grid` rule: `display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--spacing-2)`
    - Style link buttons within the grid: `text-overflow: ellipsis; overflow: hidden; white-space: nowrap; text-align: center; padding: var(--spacing-3)`
    - _Requirements: 8.1_
  - [ ] 10.9 Register Service Worker for offline-first support
    - Create `sw.js` at project root: implement `install` event caching `index.html`, `css/style.css`, `js/app.js`; implement `fetch` event with cache-first strategy
    - In `index.html` (or `app.js`): register `sw.js` via `navigator.serviceWorker.register('/sw.js')` if `'serviceWorker' in navigator`
    - Show a non-blocking toast (`<div class="toast">You are offline</div>`) when `navigator.onLine === false` or `offline` event fires
    - Add `.toast` styles to `style.css`: fixed bottom-center, slide-up animation, auto-dismiss after 4 s
    - _Requirements: 1.2, 12.1_

- [ ] 11. Property-based and unit tests (Jasmine + fast-check via CDN)
  - [x] 11.1 `test/index.html` test harness (Jasmine 5 + fast-check 3 from CDN) — already exists
  - [x] 11.2 Storage unit tests — already in `test/tests.js`
  - [x] 11.3 GreetingWidget property tests (Properties 1–3) — already in `test/tests.js`
  - [x] 11.4 GreetingWidget unit tests — already in `test/tests.js`
  - [x] 11.5 Timer property tests (Properties 4–7) — already in `test/tests.js`
  - [ ] 11.6 Write unit tests for Focus Timer (task 5.6)
    - Test initial display is `"25:00"`
    - Test Start → Stop retains elapsed time
    - Test auto-stop and `alert` notification at `00:00`
    - Test Start is ignored when `remainingSeconds === 0`
    - _Requirements: 3.1, 3.6, 3.8_
  - [ ] 11.7 Write property tests for Task Manager (Properties 8–15)
    - **Property 8** (valid task addition): `fc.string({minLength:1,maxLength:500}).filter(s=>s.trim().length>0)` → task list grows by 1, `text` is trimmed, `done===false`, localStorage updated
    - **Property 9** (whitespace input rejected): `fc.stringOf(fc.constantFrom(' ','\t','\n'))` → task list unchanged, no localStorage write
    - **Property 10** (input cleared after add): same generator as Property 8 → input `.value === ""`
    - **Property 11** (edit trims and persists): valid task + `fc.string().filter(s=>s.trim().length>0)` → `text` updated to trimmed value, localStorage updated
    - **Property 12** (whitespace edit rejected): valid task + whitespace-only string → `text` unchanged, task returns to display mode
    - **Property 13** (toggle round-trip): `fc.boolean()` initial done state → two toggles return to original state
    - **Property 14** (delete removes exactly one): `fc.array(taskGen,{minLength:1})` + index → list length `N-1`, others unchanged
    - **Property 15** (task load round-trip): `fc.array(taskGen,{maxLength:50})` → after `init()`, rendered list matches stored array
    - _Requirements: 4.2, 4.3, 4.7, 5.3, 5.4, 6.2, 6.3, 6.5, 7.1, 7.3, 7.5_
  - [ ] 11.8 Write property tests for Quick Links (Properties 16–20)
    - **Property 16** (20-link cap): `fc.array(linkGen,{minLength:0,maxLength:40})` → rendered buttons === `Math.min(length, 20)`
    - **Property 17** (valid link addition): valid `labelGen` + `urlGen` with count < 20 → count increases by 1
    - **Property 18** (invalid link rejected): empty label or non-http(s) URL → count unchanged, no localStorage write
    - **Property 19** (delete link removes exactly one): `fc.array(linkGen,{minLength:1})` + index → length `N-1`, others unchanged
    - **Property 20** (link load round-trip): `fc.array(linkGen,{maxLength:25})` → after `init()`, rendered buttons === `Math.min(length, 20)`
    - _Requirements: 8.1, 8.5, 9.2, 9.3, 9.5, 9.6, 10.2_
  - [ ] 11.9 Write unit tests for all edge cases (task 10.5)
    - GreetingWidget: immediate render on `init()`; `Date` failure shows "Time data unavailable." (already done — reference only)
    - Timer: initial display `"25:00"`; Start→Stop retains time; auto-stop + alert at `00:00`; Start ignored when at `00:00`
    - TaskManager: empty input rejected; Escape cancels edit; Delete control exists per task; empty localStorage shows empty list; corrupted localStorage shows empty list
    - QuickLinks: missing localStorage shows empty panel; `window.open` called with `noopener,noreferrer` on link click; error shown when write fails
    - Storage: `get()` returns fallback for invalid JSON; `set()` returns `false` on quota error
    - _Requirements: 1.5, 2.6, 2.7, 3.1, 3.6, 3.8, 4.3, 5.5, 6.4, 7.2, 7.4, 8.3, 8.4, 9.3_

- [ ] 12. Final checkpoint — run test harness, verify all property + unit tests pass, do a full visual QA pass
  - Open `test/index.html` in browser; all Jasmine specs must be green
  - Resize browser through all three breakpoints (< 768px, 768–1199px, ≥ 1200px) and verify layout
  - Toggle dark mode and verify all tokens switch correctly with no unthemed elements
  - Test offline mode: disable network in DevTools; verify service worker serves cached files and offline toast appears
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major widget
- Property tests validate universal correctness properties (Properties 1–20 from design.md)
- Unit tests validate specific examples and edge cases not covered by properties
- The `test/` directory is not a production file — the three-file constraint (`index.html`, `css/style.css`, `js/app.js`) applies only to the deployed dashboard
- All user-supplied content (task text, link labels, URLs) must be set via `.textContent` — never `innerHTML` — to prevent XSS
- The `sw.js` service worker is an additional file beyond the three production files; it is intentional and does not violate the constraint

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0,  "tasks": ["0.1", "0.2", "0.3"] },
    { "id": 1,  "tasks": ["1.1"] },
    { "id": 2,  "tasks": ["1.2", "1.3"] },
    { "id": 3,  "tasks": ["2.1", "3.1"] },
    { "id": 4,  "tasks": ["2.2", "2.3", "3.2"] },
    { "id": 5,  "tasks": ["2.4", "4.1"] },
    { "id": 6,  "tasks": ["4.2", "4.3", "4.4", "4.5", "5.1"] },
    { "id": 7,  "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "6.1"] },
    { "id": 8,  "tasks": ["6.2", "6.3"] },
    { "id": 9,  "tasks": ["6.4", "6.5", "6.6"] },
    { "id": 10, "tasks": ["6.7", "6.8", "6.9", "8.1"] },
    { "id": 11, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 12, "tasks": ["8.5", "8.6", "7"] },
    { "id": 13, "tasks": ["9", "10.1", "10.2", "10.3"] },
    { "id": 14, "tasks": ["10.4", "10.5", "10.6", "10.7", "10.8", "10.9"] },
    { "id": 15, "tasks": ["11.6"] },
    { "id": 16, "tasks": ["11.7", "11.8"] },
    { "id": 17, "tasks": ["11.9"] },
    { "id": 18, "tasks": ["12"] }
  ]
}
```
