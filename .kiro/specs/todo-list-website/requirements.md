# Requirements Document

## Introduction

A clean, professional personal productivity dashboard website built with HTML, CSS, and Vanilla JavaScript.
The dashboard runs entirely in the browser with no backend, using Local Storage for all persistence.
It provides four core features: a time-aware greeting, a Pomodoro-style focus timer, a to-do list with full CRUD operations, and a quick-links panel — all in a single-page layout.

## Glossary

- **Dashboard**: The single HTML page that hosts all four feature panels.
- **Greeting_Widget**: The UI component that displays the current date, time, and a time-of-day greeting message.
- **Timer**: The Pomodoro-style countdown component with Start, Stop, and Reset controls.
- **Task_Manager**: The UI component responsible for displaying, adding, editing, completing, and deleting tasks.
- **Task**: A single to-do item with a text description and a completion status (done/undone).
- **Quick_Links_Panel**: The UI component that displays and manages a collection of user-defined hyperlinks.
- **Link**: A Quick Links entry consisting of a label and a URL.
- **Local_Storage**: The browser's Web Storage API used for all client-side data persistence.
- **Pomodoro**: A 25-minute focused work interval following the Pomodoro Technique.

---

## Requirements

### Requirement 1: Dashboard Layout and Load

**User Story:** As a user, I want a single-page dashboard that loads all widgets instantly, so that I can access all productivity tools without navigation or setup.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four widgets — Greeting_Widget, Timer, Task_Manager, and Quick_Links_Panel — within a single HTML page.
2. WHEN the Dashboard is opened in a browser, THE Dashboard SHALL display all four widgets without requiring any login, configuration, or server connection, with all four widgets visible and interactive within 3 seconds on a standard broadband connection (≥ 10 Mbps).
3. THE Dashboard SHALL be compatible with the latest stable release versions of Chrome, Firefox, Edge, and Safari available at the time of testing.
4. THE Dashboard SHALL consist of exactly one HTML file, one CSS file located in `css/`, and one JavaScript file located in `js/`.
5. IF any of the four required widgets — Greeting_Widget, Timer, Task_Manager, or Quick_Links_Panel — fails to render, THEN THE Dashboard SHALL display an error message indicating which widget failed to load in place of that widget's area.

---

### Requirement 2: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting, so that I feel oriented and welcomed when I open the dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM 24-hour format, updated every 60 seconds.
2. THE Greeting_Widget SHALL display the current date in the format "DayName, D MonthName YYYY" (e.g., "Monday, 7 September 2026").
3. WHEN the local time is between 05:00 and 11:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local time is between 12:00 and 17:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local time is between 18:00 and 23:59, or between 00:00 and 04:59 inclusive, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the Greeting_Widget is first loaded, THE Greeting_Widget SHALL immediately display the current time, date, and greeting without waiting for the 60-second update interval.
7. IF the local time or date cannot be retrieved from the user's device, THEN THE Greeting_Widget SHALL display an error message indicating that time data is unavailable.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Timer SHALL display an initial countdown of 25:00 (twenty-five minutes and zero seconds).
2. WHEN the user activates the Start control, THE Timer SHALL begin counting down from the current displayed time in one-second intervals.
3. WHILE the Timer is counting down, THE Timer SHALL update the displayed time once per second in MM:SS format, where MM is minutes (00–24) and SS is seconds (00–59).
4. WHEN the user activates the Stop control, THE Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset control, THE Timer SHALL stop any active countdown and restore the display to 25:00.
6. WHEN the Timer countdown reaches 00:00, THE Timer SHALL stop the countdown automatically and notify the user that the session has ended.
7. WHILE the Timer is counting down, THE Timer SHALL disable the Start control to prevent duplicate timers.
8. IF the user activates the Start control when the displayed time is 00:00, THEN THE Timer SHALL ignore the activation and remain stopped.
9. WHILE the Timer is stopped or has not been started, THE Timer SHALL disable the Stop control.

---

### Requirement 4: To-Do List — Add Tasks

**User Story:** As a user, I want to add new tasks to my to-do list, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a text input field with a maximum length of 500 characters and an "Add" button for creating new tasks.
2. WHEN the user enters between 1 and 500 characters in the input field and activates the Add button, THE Task_Manager SHALL add a new Task with the provided text and a default status of undone.
3. WHEN the user activates the Add button with an empty input field or an input field containing only whitespace characters, THE Task_Manager SHALL not create a Task and SHALL retain focus on the input field.
4. THE Task_Manager SHALL restrict the input field to a maximum of 500 characters and SHALL not accept input beyond that limit.
5. WHEN a new Task is added, THE Task_Manager SHALL save all tasks to Local_Storage within 1 second of the Task being created.
6. IF the Local_Storage write fails when saving tasks, THEN THE Task_Manager SHALL display an error message informing the user that the task could not be saved.
7. WHEN a new Task is added, THE Task_Manager SHALL clear the input field after the Task is created.

---

### Requirement 5: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit existing task text, so that I can correct mistakes or update task descriptions.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an Edit control for each displayed Task.
2. WHEN the user activates the Edit control on a Task, THE Task_Manager SHALL replace the Task's display text with an editable text input pre-filled with the current Task text.
3. WHEN the user confirms the edit by pressing Enter or activating a Save control, THE Task_Manager SHALL trim leading and trailing whitespace from the input value, update the Task text with the trimmed value, and return the Task to display mode.
4. WHEN the user confirms an edit and the input field is empty or contains only whitespace characters, THE Task_Manager SHALL not save the change, SHALL retain the original Task text, and SHALL return the Task to display mode.
5. WHEN the user cancels the edit by pressing Escape or activating a Cancel control, THE Task_Manager SHALL discard all changes and return the Task to display mode with the original Task text unchanged.
6. WHEN a Task is updated, THE Task_Manager SHALL save all tasks to Local_Storage within 100 milliseconds of the update being confirmed.
7. WHEN the user enters text into the edit input, THE Task_Manager SHALL restrict the Task text to a maximum of 500 characters and SHALL not accept input beyond that limit.

---

### Requirement 6: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks, so that I can track my progress and keep the list tidy.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a completion toggle (checkbox or equivalent) for each Task.
2. WHEN the user activates the completion toggle on an undone Task, THE Task_Manager SHALL update the Task status to done and SHALL apply strikethrough style to the Task text.
3. WHEN the user activates the completion toggle on a done Task, THE Task_Manager SHALL update the Task status to undone and SHALL remove the strikethrough style from the Task text.
4. THE Task_Manager SHALL provide a Delete control for each Task.
5. WHEN the user activates the Delete control on a Task, THE Task_Manager SHALL remove the Task from the list permanently and SHALL no longer display the Task in the list.
6. WHEN a Task status or deletion changes, THE Task_Manager SHALL save all tasks to Local_Storage before the next user interaction is processed.
7. IF the Local_Storage write fails when saving a Task status change or deletion, THEN THE Task_Manager SHALL display an error message informing the user that the change could not be saved.

---

### Requirement 7: To-Do List — Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that my list is restored the next time I open the dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Task_Manager SHALL read all tasks from Local_Storage and render them in the list.
2. IF Local_Storage contains no task data, THEN THE Task_Manager SHALL display an empty task list without errors.
3. WHEN the task list is modified (task added, edited, deleted, or status changed), THE Task_Manager SHALL write the complete updated task array to Local_Storage as a serialized JSON array of Task objects before the modification is considered complete.
4. IF Local_Storage contains task data that cannot be parsed as a valid JSON array of Task objects, THEN THE Task_Manager SHALL discard the corrupted data and display an empty task list without errors.
5. THE Task_Manager SHALL store each Task object with at minimum the following fields: a unique identifier, the task description text, and the completion status (done or undone), such that restoring tasks from Local_Storage produces a list with equal length and equivalent field values for each Task.

---

### Requirement 8: Quick Links — Display and Open

**User Story:** As a user, I want to see my favorite website links as clickable buttons, so that I can navigate to them quickly from the dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Quick_Links_Panel SHALL read all links from Local_Storage and render each Link as a labeled, clickable button, where each button displays the link's name label truncated to a maximum of 50 characters.
2. WHEN the user activates a Link button, THE Quick_Links_Panel SHALL open the corresponding URL in a new browser tab without closing or navigating away from the current Dashboard tab.
3. IF Local_Storage contains no link data, THEN THE Quick_Links_Panel SHALL display an empty panel with no buttons and no error messages visible to the user.
4. IF Local_Storage is inaccessible or returns malformed data when the Dashboard is loaded, THEN THE Quick_Links_Panel SHALL display an empty panel and show an error message indicating that links could not be loaded.
5. WHILE the Quick_Links_Panel is rendered, THE Quick_Links_Panel SHALL display a maximum of 20 Link buttons, rendering only the first 20 links from Local_Storage when more than 20 links are stored.

---

### Requirement 9: Quick Links — Add and Delete Links

**User Story:** As a user, I want to add and remove favorite website links, so that I can personalize my quick-access panel.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide a label input field (maximum 50 characters), a URL input field (maximum 2048 characters), and an "Add Link" button for creating new links.
2. WHEN the user provides a non-empty label and a URL beginning with "http://" or "https://" and activates the Add Link button, THE Quick_Links_Panel SHALL add a new Link and render it as a button displaying the label text.
3. IF the user activates the Add Link button with an empty label field, an empty URL field, or a URL that does not begin with "http://" or "https://", THEN THE Quick_Links_Panel SHALL not create a Link and SHALL display an error message indicating which field is invalid.
4. THE Quick_Links_Panel SHALL provide a Delete control for each displayed Link.
5. WHEN the user activates the Delete control on a Link, THE Quick_Links_Panel SHALL remove only that Link from the panel permanently, leaving all other Links unaffected.
6. WHEN a Link is added or deleted, THE Quick_Links_Panel SHALL save all links to Local_Storage before the next user interaction is accepted.
7. IF the Local_Storage write fails when saving links, THEN THE Quick_Links_Panel SHALL display an error message informing the user that the change could not be saved and SHALL retain the current in-memory link state.
8. WHEN the Dashboard is loaded, THE Quick_Links_Panel SHALL restore all saved links from Local_Storage and render them as buttons, displaying a maximum of 20 links.

---

### Requirement 10: Quick Links — Persistence

**User Story:** As a user, I want my quick links to be saved automatically, so that they are available every time I open the dashboard.

#### Acceptance Criteria

1. WHEN the user adds, edits, or removes a Link, THE Quick_Links_Panel SHALL immediately save the updated link list to Local_Storage so that the change is persisted before the next user interaction.
2. WHEN the Dashboard is loaded, THE Quick_Links_Panel SHALL read the saved link list from Local_Storage and render all stored links as buttons in the panel.
3. IF Local_Storage is unavailable or the read operation fails on Dashboard load, THEN THE Quick_Links_Panel SHALL display an empty panel and show an error message indicating that saved links could not be restored.
4. IF the Local_Storage write operation fails after a link is added or removed, THEN THE Quick_Links_Panel SHALL display an error message informing the user that the change could not be saved.

---

### Requirement 11: Visual Design and Responsiveness

**User Story:** As a user, I want the dashboard to look clean and professional with readable text and clear layout, so that using it is comfortable and efficient.

#### Acceptance Criteria

1. THE Dashboard SHALL apply a consistent visual theme — including font family, color palette, spacing, and border-radius — across all four widgets, such that no widget deviates in font family, spacing unit, or border-radius value from the others.
2. THE Dashboard SHALL use a font size of at least 14px for all body text and at least 18px for widget titles.
3. THE Dashboard SHALL display all four widgets without horizontal scrolling on viewport widths of 768px and above, with each widget occupying at least 280px in width.
4. WHEN the viewport width is below 768px, THE Dashboard SHALL stack all four widgets in a single vertical column so that each widget spans the full available width and no horizontal scrollbar appears.
5. THE Dashboard SHALL apply widget titles with a font size at least 4px larger than body text, a font weight of at least 600, and a color contrast ratio of at least 4.5:1 against the widget background to distinguish them from body content.
6. WHEN the viewport width is between 768px and 1199px inclusive, THE Dashboard SHALL display all four widgets in a 2-column grid layout without horizontal scrolling.

---

### Requirement 12: Performance

**User Story:** As a user, I want the dashboard to load and respond instantly, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL complete initial render within 2 seconds on a connection of at least 25 Mbps download speed, measured from the moment the file is opened to when the UI is fully visible and interactive.
2. WHEN the user performs any interaction (add, edit, delete, timer control), THE Dashboard SHALL reflect the change in the UI within 100 milliseconds, measured from the user action confirmation (click release or key press) to the DOM update being visible.
3. THE Dashboard SHALL not block the browser's main thread for more than 50 milliseconds during any synchronous Local_Storage read or write call.
4. IF a Local_Storage read or write operation fails, THEN THE Dashboard SHALL handle the failure gracefully without freezing the UI, and SHALL display a user-visible error message within 200 milliseconds of the failure being detected.
5. WHEN the task list contains up to 500 tasks, THE Dashboard SHALL complete any single Local_Storage read or write operation and update the UI within 200 milliseconds.
