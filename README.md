# ToDoApp-js

A browser todo and event app with light and dark themes, built with plain HTML, CSS, and JavaScript.

## Features

- Add tasks and events with due date, start/end time, and optional time values
- No due date support with manual section assignment (Today or Later)
- Custom repeat scheduling by day, week (chosen weekdays), month (days of month or week-of-month), or year
- Optional repeat stop date and reveal time for future occurrences
- Tabs: Today, Tomorrow, Next 3 days, Next month, Later, Projects, Repeating, Completed, each with a count
- Projects: group tasks under labels that can nest inside each other, shown as a collapsible tree. A project task's date is optional (undated ones read as today); dated ones can also be shown in the date tabs (off by default). Tasks dated more than 3 days out stay hidden until they get closer
- Tick the circle to complete a task: it stays crossed off until you press its X (or until tomorrow), then lives in Completed
- Per-task "…" menu: postpone (+2h, +1d, +2d, +3d), move no-due items, add to or move between projects, show/hide a project task in the date tabs, edit repeat rules, delete
- Per-project "…" menu: add task, add sub-project, rename, move under another project, delete (its tasks and sub-projects move up a level)
- Search the current tab
- Import and export tasks and projects as JSON via the clipboard (account menu); older task-only exports still import
- Light and dark themes; follows the system setting until you pick one
- Firebase Realtime Database sync with Google sign-in

## Files

- `index.html` — page structure, sign-in screen, add-item sheet
- `styles.css` — the Graphite design tokens and all component styles
- `script.mjs` — task logic, tabs, menus, Firebase sync
- `view-logic.mjs` — pure display helpers (time column, overdue, theme), unit-tested
- `project-logic.mjs` — pure project-tree helpers (children, descendants, picker order, date-tab visibility), unit-tested
- `icons.mjs` — inline SVG icon set

## Run locally

1. Start a local HTTP server: `py -m http.server 8000`
2. Open `http://localhost:8000/` and sign in with Google.

## Tests

`node --test` (Node 20+, no dependencies)

## Notes

- Tasks and projects are stored in Firebase under your account (`tasks` and `projects`); nothing task-related is kept in the browser.
- `localStorage` holds only the theme choice (`todo-theme`) and which projects are collapsed on this device (`todo-collapsed-projects`).
- Items overdue from earlier days show in Today with an orange time.
- Clipboard import/export uses JSON text on the clipboard.
