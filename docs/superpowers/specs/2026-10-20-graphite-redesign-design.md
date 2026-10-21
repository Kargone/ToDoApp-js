# ToDo App — "Graphite" visual redesign

Date: 2026-10-20
Mockups: `.superpowers/brainstorm/1716-1792554618/content/` (`visual-direction.html` option B, `row-actions.html` option A, `add-form.html` option B, `full-picture.html` — the composed target)

## Intent and the why

The app is used in short bursts: open it, find a task, tick it off. The current
look works against that. A radial navy gradient and blurred glass panels sit
behind everything, and every surface is the same shade of blue, so nothing
stands out as more important than anything else. Each row shows six text
buttons (Mark complete, Delete, +2h, +1d, +2d, +3d), which buries the one action
that matters.

The goal is a restrained, professional look where every element visibly
belongs to one system: neutral greys, a real type scale, hairline borders, one
signal color. It must have light and dark modes and use SVG icons only.

## Goals

- **Completing is one tap on a circle** at the left of each row. That circle
  replaces the "Mark complete" button.
- **Graphite visual system** (tokens below), with light and dark themes and a
  sun/moon toggle in the header.
- **Quiet rows.** Each row is checkbox, title (plus a meta line when there is
  one), a right-aligned monospace time column, and a ghost "…" button. All
  secondary actions go in the "…" menu.
- **Add-item becomes a sheet.** A "New item" button, or the `N` key, opens a
  panel. It slides up from the bottom on narrow screens and appears as a
  centered dialog on desktop.
- **Header** with the app name/mark, search, the theme toggle, and an account
  menu (Export JSON, Import JSON, Sign out).
- **New sign-in screen.** No floating card and no glow (see the layout below).
- **Icons are inline SVG only**, stroked, using `currentColor`. No emoji
  anywhere, no icon font, no CDN icon library.

## Non-goals

- No changes to scheduling and repeat logic, categorization, Firebase
  sync/auth flow, or the data shape stored in `localStorage` and Firebase.
  This is a presentation change.
- No framework and no build step. The app stays as vanilla `index.html` +
  `styles.css` + `script.mjs`.
- No new task features beyond the small additions listed under "Agreed
  additions".

## Anti-goals (a failure even if it technically works)

- Any gradient, glassmorphism/backdrop blur, or glow left in the page.
- Color used decoratively. Orange showing up anywhere other than the
  overdue/danger meaning.
- Any emoji, or an icon that isn't an inline SVG.
- Stacked drop shadows on cards. Shadows are allowed only on floating layers
  (the menu, the sheet) and must be subtle.
- Losing any existing capability while the UI is reorganized (every form
  option, rename, postpone, repeat editing, no-due section choice,
  import/export).

## Visual system (decided)

### Color tokens

Define these on `:root`; dark mode overrides them under `[data-theme="dark"]`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0E0E10` | page and surfaces |
| `--panel` | `#F6F6F7` | `#18181B` | segmented-control track, hovered rows/menu items |
| `--fg` | `#111113` | `#EDEDEF` | primary text |
| `--muted` | `#6B6B73` | `#8B8B93` | secondary text, idle icons |
| `--muted-2` | `#C4C4CB` | `#45454C` | empty checkbox ring, strikethrough |
| `--line` | `#E8E8EB` | `#232327` | all 1px borders and dividers |
| `--accent` | `#111113` | `#EDEDEF` | primary button, filled checkbox, selected weekday buttons |
| `--on-accent` | `#FFFFFF` | `#0E0E10` | text and icons on accent |
| `--warn` | `#D9480F` | `#FF7A45` | overdue time, Delete, destructive text only |

The primary accent is deliberately the foreground color, not a hue. Orange is
the only hue in the UI. The one exception is the multicolor Google "G" on the
sign-in button, which Google's brand guidelines require.

### Type

- Sans: `"Inter", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif`
  (system stack; no web-font download required).
- Mono: `ui-monospace, "Cascadia Mono", Consolas, monospace`. Used for times,
  tab counts, keyboard hints and the small `EVENT` tag.
- Scale (px): 11 / 12 / 13 / 14 / 18 / 24. Page heading 24, weight 600,
  letter-spacing −0.025em. Body 13–14.
- Numbers use `font-variant-numeric: tabular-nums`.

### Shape and spacing

- Radius: 4px for tiny tags and kbd hints, 6px for controls (inputs, buttons,
  icon buttons), 8px for the list container, segmented track and menu, and
  12px for the sheet's top corners / dialog.
- Spacing on a 4px grid. Row padding is about 9px vertical and 12px
  horizontal.
- Borders are 1px `--line`. Rows in a list share one bordered container with
  1px dividers between them; they are not separate cards.

## Screens and components

### Sign-in

Full-viewport flat `--bg`. The app mark and name sit top-left; the mark is a
small rounded square in `--fg` with an SVG check. The content block is
left-aligned, not a centered card:

- Heading: "Everything due, in the order it's due."
- One line: "Tasks, events and repeating chores sorted into Today, Tomorrow and
  beyond. Synced across your devices."
- A bordered "Continue with Google" button with the Google G SVG.
- A small monospace footer line.

The theme toggle should work here too.

### Header (app)

The mark and name sit left. On the right are icon buttons: Search, Theme,
Account. Account opens a menu with Export JSON, Import JSON, a divider, and
Sign out.

Sign out calls Firebase `signOut(auth)` and returns to the sign-in screen,
re-enabling the commented-out handler in `script.mjs`. Export/Import keep their
current clipboard behavior.

### Day heading

A small muted date ("Tuesday, October 20") above a 24px title that names the
active tab ("Today", "Tomorrow", "Next 3 days", …). A right-aligned mono count
shows "N open · M done" for the current view (see "Completing a task").

### Tabs

A segmented control (a track in `--panel`, with the active tab as a `--bg` chip
with a 1px `--line` ring). All seven tabs are kept: Today, Tomorrow, Next 3
days, Next month, Later, Repeating, Completed. Each tab shows a mono count of
its items. On narrow screens the track scrolls horizontally rather than
wrapping.

### Task row

`[checkbox] [title / meta] [time] […]`

- **Checkbox:** an 18px circle with a `--muted-2` ring. On hover the ring turns
  `--fg`. When complete it fills with `--accent` and shows an SVG check.
  Clicking it calls the existing `toggleTask`. The hit area is at least 32px.
- **Title:** clicking it starts the existing inline rename where
  `canRenameTask` allows. Completed rows are `--muted` with a strikethrough.
- **Meta line** (only when needed): a repeat SVG icon plus
  `formatRepeatLabel` text; "until HH:MM" for events. An `EVENT` mono tag sits
  next to event titles. The Completed/Upcoming states, currently shown as
  badges, are conveyed by row styling: completed rows get a strikethrough, and
  virtual (upcoming) rows get muted text and a dashed checkbox ring that can't
  be clicked.
- **Time column:** mono, right-aligned, fixed width. Shows the due/start time,
  or a short day ("MON") when the item is not today. Overdue items use `--warn`.
  Shows "—" when there is none.
- **"…" menu** (ghost icon button), with contents by tab:
  - Date tabs, items with a due date: Later today (+2h), Tomorrow (+1d), In 2
    days (+2d), In 3 days (+3d), divider, Delete. These call the existing
    `postponeTask` / `removeTask`.
  - Date tabs, no-due items: "Show in Today" / "Show in Later" (replacing the
    per-row `<select>`), divider, Delete.
  - Repeating tab: "Edit repeat rule", which expands the existing repeat editor
    inline under the row, restyled to the system; divider; Delete.
  - Completed tab: "Mark active", divider, Delete.
  - Virtual occurrences: no menu, the same as now.
- Delete is styled in `--warn`. Menu items have a leading SVG icon and a
  trailing mono shortcut hint (`+2h` etc.) where relevant. Close the menu on
  outside click and on Esc.

### Empty state

A quiet line of muted text inside the list container. No dashed box and no
illustration.

### Add-item sheet

Opened by the "New item" button or the `N` key, but `N` does nothing when focus
is in an input. On wide screens the "New item" button sits bottom-right under
the list; on phones it floats at the bottom-right. A scrim dims the list behind
the sheet. The sheet closes on Esc, Cancel, a scrim click, or a successful
add.

Contents, top to bottom:

1. A header row reading "New item", with a Task / Event segmented switch that
   replaces the `<select>`.
2. The title input, autofocused.
3. Task mode: Due day and Time side by side, plus a "No due date" switch. When
   that switch is on, a "Place in" Today/Later choice appears. Event mode: Start
   day, Start time, End time.
4. A divider, then a Repeat switch. When it is on, the existing repeat fields
   appear, grouped and restyled:
   - Every [N] [unit] and Reveal time.
   - The weekday button row (S M T W T F S) for weekly repeats.
   - Monthly pattern, then either days-of-month or week-of-month buttons plus
     day-of-week buttons.
   - Stop on.
5. Cancel (ghost) and Add (primary), right-aligned.

The existing behavior is kept: field resets after submit, `updateFormMode`,
`updateNoDueState`, `updateRepeatVisibility`, and
`updateRepeatFieldVisibility`. The current "options appear once you type"
behavior goes away, because the sheet always shows the fields.

### Search

The search icon in the header reveals a search input under the header. It
filters the current tab (any tab, not only Completed) using the existing
`searchQuery` filter in `getItemsForTab`. The input clears on tab change, as
it does now, and Esc closes it.

### Theme toggle

Store the theme as `data-theme="light|dark"` on `<html>`. On first visit,
follow `prefers-color-scheme`; after that, use the choice saved in
`localStorage` (key `todo-theme`). Apply the theme before first paint (a small
inline script in `<head>`) so there's no flash. Update `<meta name="theme-color">`
to match. The icon shows a sun in light mode and a moon in dark mode.

### Motion

Kept to purposeful feedback only:

- The background and color transition when the theme changes (about 150ms).
- The sheet slides up and fades in (about 180ms).
- The menu fades in.
- Hover and focus states on everything interactive.

No scroll-triggered animation. Respect `prefers-reduced-motion`.

### Accessibility

Visible focus rings (2px `--fg` outline with offset). Icon buttons get
`aria-label`. The menu and the sheet use proper roles (`menu`/`menuitem`,
`dialog` with `aria-modal`) and trap or return focus sensibly. Contrast for
`--muted` text on `--bg` meets AA in both themes.

## Agreed additions

These were the user's guesses-turned-decisions, confirmed after the
full-picture mockup:

1. Search works on every tab.
2. Each tab shows a mono count of its items.
3. The `N` shortcut opens the add sheet, and events get an `EVENT` tag.

## Completing a task (decided by the user)

Tapping the circle does not make the row disappear. The row stays where it is,
the circle fills with a check, and the title gets a strikethrough. The "…"
button on that row is replaced by an **X** icon button, and clicking the X
removes the row from the date tab. The task still appears in Completed, as
it does today. Tapping the filled circle again un-completes the task, and the
X turns back into "…".

Implementation (Claude's call):

- When a task is completed through the circle, set `completedOn: <today ISO>`
  on it. For repeating tasks this goes on the `completedOccurrence` that
  `toggleTask` creates.
- Clicking the X sets `dismissed: true`.
- A completed item appears in its date tab only if `completedOn === today` and
  it is not `dismissed`. It sits in the slot its date would put it in, which
  for most items is Today. Existing completed items have no `completedOn`, so
  they never reappear in date tabs.
- If a struck-through item isn't dismissed, it drops out of the date tabs
  automatically the next day, so leftovers don't pile up.
- Un-completing clears both fields.
- This adds two optional fields to stored tasks. It is the one exception to
  the "no data-shape changes" non-goal, and old data stays valid.
- Since `completedOn` now exists, the day heading count can be "N open · M done"
  (where M is the struck-through items still showing).

## Calls made by the designer (check these)

Decided by Claude, not the user, after the builder review:

- **Overdue vs. due soon.** Orange `--warn` on the time column means past due:
  a due/start date before today, or a time earlier than now today. Past-due
  items already land in Today via `getCategory`. The existing "due within 4
  hours" cue (`isItemUrgent`, `.urgent`) stays, shown as the time in `--fg`
  weight 600 with no color.
- **Time column format.** If the item is today and has a time, show `HH:MM` (24h, matching the
  mockups). Today without a time, and anything within ±6 days, shows the weekday (`TUE`, `MON`) — changed at the user's request after review. Otherwise show month and
  day (`OCT 28`). With no due date, show `—`. The column is 52px wide.
  The full `formatDueLabel` text appears as the cell's `title` tooltip so no
  information is lost.
- **Repeating tab rows have no checkbox,** matching today's behavior (there is
  no complete action there). A muted repeat icon sits in the checkbox's slot so
  the columns stay aligned.
- **Sign out** clears the in-memory `tasks` array and `editingTaskId`, resets
  to the Today tab, and shows the sign-in screen. Tasks persist only in
  Firebase (`saveTasks` only syncs remotely; the README's mention of
  `localStorage` is outdated), so nothing local needs wiping.

## Constraints

- Vanilla HTML/CSS/ES modules, served as static files (`py -m http.server`).
- Firebase is loaded from gstatic as it is today. Don't touch its config or
  sync logic.
- Must work at phone width (about 360px) and desktop width. Respect
  `env(safe-area-inset-bottom)` for the floating button and the sheet.
- `styles.css` is rewritten from scratch. The old file contains large
  commented-out blocks and the gradient/glass rules, and none of it carries
  over.

## Left to the builder

- Exact SVG path data. Use a consistent 24×24 viewBox and a 1.6 stroke, in the
  same style as the mockups.
- How the DOM for the menu and sheet is structured, and whether the sheet is a
  native `<dialog>` element.
- The desktop max content width. About 680px is suggested, with the header
  spanning full width.
- Implementation details of tab counts. Computing them may reuse
  `getItemsForTab` logic per tab, but it must not mutate state.
- Small copy tweaks, as long as the copy stays specific and plain.
