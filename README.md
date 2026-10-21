# ToDoApp-js

A browser todo and event app with light and dark themes, built with plain HTML, CSS, and JavaScript.

## Features

- Add tasks and events with due date, start/end time, and optional time values
- No due date support with manual section assignment (Today or Later)
- Custom repeat scheduling by day, week (chosen weekdays), month (days of month or week-of-month), or year
- Optional repeat stop date and reveal time for future occurrences
- Tabs: Today, Tomorrow, Next 3 days, Next month, Later, Repeating, Completed, each with a count
- Tick the circle to complete a task: it stays crossed off until you press its X (or until tomorrow), then lives in Completed
- Per-task "…" menu: postpone (+2h, +1d, +2d, +3d), move no-due items, edit repeat rules, delete
- Search the current tab
- Import and export task data as JSON via the clipboard (account menu)
- Light and dark themes; follows the system setting until you pick one
- Firebase Realtime Database sync with Google sign-in

## Files

- `index.html` — page structure, sign-in screen, add-item sheet
- `styles.css` — the Graphite design tokens and all component styles
- `script.mjs` — task logic, tabs, menus, Firebase sync
- `view-logic.mjs` — pure display helpers (time column, overdue, theme), unit-tested
- `icons.mjs` — inline SVG icon set

## Run locally

1. Start a local HTTP server: `py -m http.server 8000`
2. Open `http://localhost:8000/` and sign in with Google.

## Tests

`node --test` (Node 20+, no dependencies)

## Notes

- Tasks are stored in Firebase under your account; nothing task-related is kept in the browser.
- The theme choice is the only thing saved in `localStorage` (key `todo-theme`).
- Items overdue from earlier days show in Today with an orange time.
- Clipboard import/export uses JSON text on the clipboard.
