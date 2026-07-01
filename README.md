# ToDoApp-js

A dark-mode browser todo and event app built with HTML, CSS, and JavaScript.

## Features

- Add tasks and events with due date, start/end time, and optional time values
- No due date support with manual section assignment
- Custom repeat scheduling by day, week, month, or year
- Optional repeat stop date and repeat time for future occurrences
- Repeating task tab with virtual occurrence rendering
- Search/filter tasks by text
- Import and export task data as JSON via clipboard
- Quick postpone controls for due tasks
- Organized tabs: Today, Tomorrow, Next 3 Days, Later, Repeating, Completed
- Mark tasks complete and reopen completed items
- Persistent storage using `localStorage`
- Firebase Realtime Database sync with anonymous auth (when running via HTTP)

## Files

- `index.html` — app structure and UI
- `styles.css` — dark theme styling and layout
- `script.mjs` — task logic, tabs, filters, persistence, and Firebase sync

## Run locally

1. Start a local HTTP server and open `index.html` in your browser.
   - Example: `py -m http.server 8000`
2. Access the app at `http://localhost:8000/`.
3. Use Firebase sync only when served over HTTP/HTTPS.

## Notes

- Tasks overdue by a day are shown in the Today section.
- `localStorage` keeps your tasks on the same browser and machine.
- Clipboard import/export uses JSON text on the clipboard.

## Future improvements

- Add editing for existing tasks
- Add due-date sorting and richer overdue highlighting
- Add tags, calendar view, and better repeat pattern editing
