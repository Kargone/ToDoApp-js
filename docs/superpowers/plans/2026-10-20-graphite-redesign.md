# Graphite Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the ToDo app in the approved "Graphite" visual system: light and dark themes, quiet rows with a complete-circle and a "…" menu, an add-item sheet, a header with search, theme and account menus, and strike-then-X completion.

**Architecture:** The pure display logic (time cell, overdue, lingering-done, theme resolution) moves into a new DOM-free module `view-logic.mjs`, unit-tested with Node's built-in test runner. `script.mjs` imports it and keeps all scheduling, repeat and Firebase logic. `index.html` is restructured but keeps every existing form-control `id` so the current form wiring keeps working. `styles.css` is rewritten from scratch.

**Tech Stack:** Vanilla HTML, CSS and ES modules; Firebase 12.15.0 from gstatic (unchanged); `node --test` for unit tests (Node 24, zero dependencies).

**Spec:** `docs/superpowers/specs/2026-10-20-graphite-redesign-design.md`. Read it fully; it holds the token table, type scale, radii, menu contents per tab, and sheet contents. The composed visual target is `.superpowers/brainstorm/1716-1792554618/content/full-picture.html`; `row-actions.html` (option A) and `add-form.html` (option B) hold the details.

## Global Constraints

- No gradients, no `backdrop-filter`, no glow; shadows only on the menu and the sheet, and subtle (`0 8px 24px -10px rgba(0,0,0,.25)` or lighter).
- No emoji anywhere; every icon is inline SVG, 24×24 viewBox, `stroke="currentColor"`, `fill="none"`, stroke-width 1.6, round caps and joins. The only multicolor SVG is the Google "G".
- Orange (`--warn`) appears only for overdue times, Delete, and destructive text.
- Color tokens are exactly as in the spec table; light on `:root`, dark on `:root[data-theme="dark"]`.
- Type scale is limited to 11 / 12 / 13 / 14 / 18 / 24 px. Sans: `"Inter", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif`. Mono: `ui-monospace, "Cascadia Mono", Consolas, monospace`.
- Radii are 4 / 6 / 8 / 12 px only; borders are 1px `var(--line)`.
- Theme persistence uses the `localStorage` key `todo-theme`, with values `"light"` or `"dark"`.
- Do not change repeat/scheduling functions, `getCategory` date rules, Firebase config, or `syncTasksToFirebase`/`loadRemoteTasks`. The only data-shape additions are the optional `completedOn` (ISO date string) and `dismissed` (boolean).
- Works at a 360px viewport width and on desktop; bottom-anchored UI pads by `env(safe-area-inset-bottom)`.
- Respect `prefers-reduced-motion: reduce` by disabling the sheet and menu transitions.

## Review Focus

1. **Crossing midnight with a struck-through item:** completed yesterday and never X'd, it must not appear in today's Today tab. Covered by the `showsInDateTab` test in Task 1.
2. **Completing a repeating task via the circle:** the struck-through completed occurrence shows in Today, and the template advances without leaving a second unstruck copy for the same day. Covered by the browser check in Task 2.
3. **Due today with a time already passed vs. no time:** the first is overdue (orange); the second is not, and no-due items are never overdue. Covered by the `isOverdue` tests in Task 1.
4. **Pressing `N` while typing** (rename input, search box, sheet fields) must type the letter, not open the sheet. Covered by `shouldOpenSheetOnKey` in Task 1.
5. **`localStorage` unavailable or holding junk** (private mode, an old value): the theme falls back to `prefers-color-scheme` and nothing throws. Covered by the `resolveTheme` tests in Task 1 and the try/catch in Task 3.

## File Structure

| File | Responsibility |
|---|---|
| `view-logic.mjs` (new) | Pure, DOM-free display helpers. Imported by `script.mjs` and tests. |
| `tests/view-logic.test.mjs` (new) | `node --test` unit tests for `view-logic.mjs`. |
| `index.html` | Markup: sign-in, header, day heading, tabs, list, add sheet (`<dialog>`), inline theme bootstrap in `<head>`. |
| `styles.css` | Full rewrite: tokens, both themes, all components. |
| `icons.mjs` (new) | `icon(name)` returns an SVG string for each icon the JS renders (check, more, x, repeat, clock, calendar, arrow-right, arrow-skip, trash, undo, edit, today, later). Static icons in `index.html` are inlined directly. |
| `script.mjs` | Existing logic plus: imports, completion lifecycle, new row rendering, menus, sheet, header behaviors, counts. |
| `README.md` | Fix the storage description; describe the themes. |

---

### Task 1: Pure display logic module

**Files:**
- Create: `view-logic.mjs`
- Create: `tests/view-logic.test.mjs`

**Interfaces:**
- Produces (all named exports):
  - `toIsoDate(date: Date): string` returns local `YYYY-MM-DD`.
  - `itemDate(item): string | undefined` returns `startDate` for events, otherwise `dueDate`.
  - `itemTime(item): string | undefined` returns `startTime` for events, otherwise `dueTime`.
  - `isOverdue(item, now: Date): boolean`. False if `completed`, `isVirtual`, `noDue`, or no date. True if date < today; also true if date === today and there is a time and `date+time < now`.
  - `formatTimeCell(item, now: Date): string`. Today with a time gives `"HH:MM"` (24h, as stored). Within ±6 days of today gives the uppercase 3-letter weekday (`"MON"`). Otherwise gives uppercase `"OCT 28"`. Today without a time, no date, or noDue gives `"—"`.
  - `showsInDateTab(item, todayIso: string): boolean`. If `!item.completed`, returns true. If completed, returns true only when `item.completedOn === todayIso && !item.dismissed`.
  - `resolveTheme(stored: unknown, prefersDark: boolean): 'light' | 'dark'`. Returns `stored` if it is `'light'` or `'dark'`, otherwise `prefersDark ? 'dark' : 'light'`.
  - `shouldOpenSheetOnKey(event: {key, ctrlKey, metaKey, altKey, target: {tagName, isContentEditable}}): boolean`. True only for `key` `n`/`N` with no modifier, when the target tag is not INPUT, TEXTAREA or SELECT and is not contentEditable.

- [ ] **Step 1: Write the failing tests** in `tests/view-logic.test.mjs` using `node:test` and `node:assert/strict`. Fix `now = new Date(2026, 9, 20, 14, 0)` (Tue Oct 20 2026, 14:00 local).
  - `isOverdue`: `{dueDate:'2026-10-19'}` is true; `{dueDate:'2026-10-20', dueTime:'13:59'}` is true; `{dueDate:'2026-10-20', dueTime:'14:30'}` is false; `{dueDate:'2026-10-20'}` is false; `{noDue:true}` is false; `{dueDate:'2026-10-19', completed:true}` is false; `{type:'event', startDate:'2026-10-20', startTime:'09:00'}` is true.
  - `formatTimeCell`: `{dueDate:'2026-10-20', dueTime:'18:30'}` gives `'18:30'`; `{dueDate:'2026-10-19'}` gives `'MON'`; `{dueDate:'2026-10-26'}` gives `'MON'`; `{dueDate:'2026-10-27'}` gives `'OCT 27'`; `{dueDate:'2026-10-13'}` gives `'OCT 13'`; `{dueDate:'2026-10-20'}` gives `'—'`; `{noDue:true}` gives `'—'`.
  - `showsInDateTab`: `{}` is true; `{completed:true}` is false; `{completed:true, completedOn:'2026-10-20'}` with today `'2026-10-20'` is true; the same with `dismissed:true` is false; `{completed:true, completedOn:'2026-10-19'}` is false.
  - `resolveTheme`: `('dark', false)` gives `'dark'`; `(null, true)` gives `'dark'`; `('purple', false)` gives `'light'`; `(undefined, false)` gives `'light'`.
  - `shouldOpenSheetOnKey`: `{key:'n', target:{tagName:'BODY'}}` is true; `{key:'N', target:{tagName:'DIV'}}` is true; `{key:'n', target:{tagName:'INPUT'}}` is false; `{key:'n', ctrlKey:true, target:{tagName:'BODY'}}` is false; `{key:'n', target:{tagName:'DIV', isContentEditable:true}}` is false; `{key:'m', target:{tagName:'BODY'}}` is false.

- [ ] **Step 2: Run the tests to confirm they fail**
  Run: `node --test tests/`
  Expected: FAIL with `Cannot find module` for `view-logic.mjs`.

- [ ] **Step 3: Implement `view-logic.mjs`** with the exports above. Compare ISO strings for the date, and for the "±6 days" check use day differences computed from local-midnight `Date`s. Use `toLocaleDateString('en-US', …)` for the weekday and month names, then uppercase them.

- [ ] **Step 4: Run the tests to confirm they pass**
  Run: `node --test tests/`
  Expected: every test passes, 0 fail.

- [ ] **Step 5: Commit**
  ```bash
  git add view-logic.mjs tests/view-logic.test.mjs
  git commit -m "Add pure view-logic helpers with tests"
  ```

---

### Task 2: Strike-then-X completion lifecycle

**Files:**
- Modify: `script.mjs`: `toggleTask` (~928–991), `getItemsForTab` (~543–608), plus a new `dismissTask`

**Interfaces:**
- Consumes: `showsInDateTab`, `toIsoDate` from Task 1 (add `import … from './view-logic.mjs'` beside the Firebase imports).
- Produces: `dismissTask(taskId: string): void`, which sets `dismissed = true`, then `saveTasks()` and `renderTasks()`.

- [ ] **Step 1: Change `toggleTask`.** On completion, set `completedOn: getTodayIso()` and `dismissed: false`. That applies to the plain toggle branch (when moving to completed), the repeat `completedOccurrence`, and the final-occurrence branch. On un-completion (`completed` becomes false), delete both `completedOn` and `dismissed`.
- [ ] **Step 2: Change `getItemsForTab`.** In the `today` and `later` filters, and the `nextMonth` event filter, replace the bare `item.completed` exclusion with `!showsInDateTab(item, getTodayIso())`. For `tomorrow` and `next3` `baseItems` (via `getCategory`, which returns `'completed'` for done items), also include completed items where `showsInDateTab` is true and the category computed with `{...item, completed:false}` equals `activeTab`. The `completed` and `repeating` tabs are unchanged.
- [ ] **Step 3: Add `dismissTask`** next to `removeTask`.
- [ ] **Step 4: Verify the logic is still green.**
  Run: `node --test tests/`
  Expected: all pass. The UI for the X button arrives in Task 5; until then, verify in the browser console after signing in: `toggleTask(id)` on a Today task keeps it in the Today list with `completed:true` and `completedOn` set to today.
- [ ] **Step 5: Commit**
  ```bash
  git add script.mjs
  git commit -m "Keep completed items struck through until dismissed"
  ```

---

### Task 3: Tokens, theme bootstrap, stylesheet rewrite

**Files:**
- Modify: `index.html` `<head>`
- Rewrite: `styles.css`
- Modify: `script.mjs` (theme toggle wiring)

**Interfaces:**
- Consumes: `resolveTheme` from Task 1.
- Produces: `applyTheme(theme: 'light'|'dark'): void` in `script.mjs`. It sets `document.documentElement.dataset.theme`, sets `meta[name=theme-color]` to `#FFFFFF` or `#0E0E10`, saves to `localStorage['todo-theme']` inside try/catch, and updates every `[data-theme-toggle]` button's `aria-label` to "Switch to dark theme" / "Switch to light theme". CSS hooks used by later tasks: `.hidden`, `.btn`, `.btn-ghost`, `.icon-btn`, `.icon-btn--ghost`, `.seg` / `.seg__opt[aria-pressed="true"]`, `.list`, `.row`, `.row--done`, `.row--virtual`, `.chk`, `.row__body`, `.row__title`, `.row__meta`, `.row__time`, `.row__time--late`, `.row__time--soon`, `.tag`, `.menu`, `.menu__item`, `.menu__item--danger`, `.menu__sep`, `.menu__hint`, `.sheet`, `.field`, `.switch`, `.daypick` / `.daypick__opt.selected`, `.kbd`.

- [ ] **Step 1: Add a `<head>` inline script** before the stylesheet link. Inside try/catch, it reads `localStorage['todo-theme']` and `matchMedia('(prefers-color-scheme: dark)').matches`, applies the same rule as `resolveTheme` (inlined, because a module can't load before paint), and sets `data-theme` on `<html>`. On error it falls back to the media query.
- [ ] **Step 2: Rewrite `styles.css`.** Start with the token table from the spec on `:root` and `:root[data-theme="dark"]`, then a reset, body (`background: var(--bg)`, `color: var(--fg)`, sans stack, 14px), and every class listed in Produces, matching `full-picture.html` and `row-actions.html` option A. Theme transitions take 150ms on `background-color, color, border-color`. Focus ring: `outline: 2px solid var(--fg); outline-offset: 2px` on `:focus-visible`. Delete every old rule, including the commented-out blocks.
- [ ] **Step 3: Wire the toggle in `script.mjs`.** Call `applyTheme(resolveTheme(document.documentElement.dataset.theme, false))` on load, and on click of any `[data-theme-toggle]` flip to the other theme.
- [ ] **Step 4: Verify.** Serve with `py -m http.server 8000` and open `http://localhost:8000/`. Expected: the sign-in page renders with a flat background in both themes. DevTools shows no `linear-gradient`, `radial-gradient` or `backdrop-filter` in computed styles (`grep -nE "gradient|backdrop" styles.css` returns nothing). After toggling and reloading, the chosen theme persists with no flash. With `localStorage` blocked in DevTools, the page still loads and follows the OS theme.
- [ ] **Step 5: Commit**
  ```bash
  git add index.html styles.css script.mjs
  git commit -m "Graphite tokens, light/dark themes and stylesheet rewrite"
  ```

---

### Task 4: Markup restructure (sign-in, header, heading, tabs, sheet)

**Files:**
- Modify: `index.html` body
- Create: `icons.mjs`
- Modify: `script.mjs` (element lookups only)

**Interfaces:**
- Produces these DOM ids for Tasks 5–6: `sign-in-shell`, `sign-in-button`, `app-shell`, `search-button`, `search-toolbar`, `search-input`, `account-button`, `account-menu`, `export-json`, `import-json`, `sign-out-button`, `day-date`, `day-title`, `day-count`, `todo-list`, `empty-state`, `new-item-button`, `add-sheet` (a `<dialog>`), `sheet-cancel`, `type-task`, `type-event`. Each `.tab` keeps `data-tab` and gains a `<span class="tab__count" data-count-for="<tab>">`.
- Produces: `icon(name: string): string` in `icons.mjs`. It throws on an unknown name.
- Keeps unchanged: every existing form-control id (`todo-form`, `todo-input`, `item-type`, `due-date`, … `repeat-end`) and the `.weekday-pill` / `data-day` / `data-week` attributes the repeat code queries.

- [ ] **Step 1: Sign-in.** `<section id="sign-in-shell">`, using the spec's copy exactly: heading "Everything due, in the order it's due.", the line "Tasks, events and repeating chores sorted into Today, Tomorrow and beyond. Synced across your devices.", a "Continue with Google" button with the G SVG, a theme toggle, and a mono footer.
- [ ] **Step 2: App shell.** Header (mark + "ToDo", search, theme, account menu with Export JSON, Import JSON, separator, Sign out), the day heading block, the segmented tabs (all seven, same `data-tab` values), the list, the empty state, and the `#new-item-button` labelled "New item" with a `kbd` N hint. Remove the bottom export/import section.
- [ ] **Step 3: Sheet.** Move the whole `<form id="todo-form">` into `<dialog id="add-sheet" class="sheet" aria-labelledby="sheet-title">`, ordered as in the spec's "Add-item sheet" section:
  1. Header with "New item" and Task/Event `.seg` buttons `#type-task` / `#type-event`. Keep `<select id="item-type">` visually hidden; the segment buttons set its value and dispatch `change`.
  2. The title input.
  3. The task/event date fields and the No-due switch.
  4. A divider and the Repeat switch (`#repeat-task` restyled as a switch), with the repeat controls.
  5. Cancel and Add.
  Remove the `#advanced-options` wrapper and the `.submit-row` hiding, and delete the `todoInput` `input` listener plus every `advancedOptions` / `submitRow` reference in `script.mjs`.
- [ ] **Step 4: `icons.mjs`.** Paths in the mockup style for the names listed in File Structure.
- [ ] **Step 5: Verify.** Run `node --test tests/` (pass). In the browser: sign in with Google, and the app shell shows. Open DevTools, and the console has no `null` element errors on load. The form still adds a task when submitted through the dialog (temporarily call `document.getElementById('add-sheet').showModal()` from the console).
- [ ] **Step 6: Commit**
  ```bash
  git add index.html icons.mjs script.mjs
  git commit -m "Restructure markup: sign-in, header, tabs and add sheet"
  ```

---

### Task 5: Row rendering and per-row menus

**Files:**
- Modify: `script.mjs` (`renderTasks` ~643–822, `createRepeatEditor` markup classes)

**Interfaces:**
- Consumes: `isOverdue`, `formatTimeCell` (Task 1); `dismissTask` (Task 2); `icon` (Task 4); CSS classes (Task 3).
- Produces: `openMenu(anchor: HTMLElement, items: Array<{label, icon, hint?, danger?, onSelect} | 'sep'>): void` and `closeMenu(): void`. Only one menu is open at a time. It is positioned under the anchor and right-aligned, closes on outside click, Esc or select, and returns focus to the anchor. Markup is `role="menu"`, with `role="menuitem"` buttons and arrow-key navigation. Task 6 reuses it for the account menu.

- [ ] **Step 1: Build each row as** `li.row` → `button.chk` (`aria-label` "Mark complete" or "Mark not complete", calls `toggleTask`) → `.row__body` (title + optional meta) → `span.row__time` → trailing control. The time is `formatTimeCell(task, new Date())`, with `title` set to `formatDueLabel(task)`; add `row__time--late` when `isOverdue`, otherwise `row__time--soon` when `isItemUrgent`. The meta line holds the repeat icon + `formatRepeatLabel(rule)` for repeat rules, and "until <end time>" for events with an `endTime`. Event titles get `<span class="tag">EVENT</span>`. Remove all `.badge` creation.
- [ ] **Step 2: Row state.** Completed rows get `row--done`, and their trailing control is an `icon-btn--ghost` X (`aria-label` "Remove from list") calling `dismissTask`. This applies only outside the Completed tab; on the Completed tab, use the menu. Virtual rows get `row--virtual`: a disabled `.chk` with a dashed ring and no trailing control. Repeating-tab rows get a muted repeat icon in place of `.chk`.
- [ ] **Step 3: "…" menus.** The trailing `icon-btn--ghost` with `icon('more')` and `aria-label` "More actions" calls `openMenu` with the per-tab items from the spec's "Task row" section. The postpone labels are "Later today" / "Tomorrow" / "In 2 days" / "In 3 days" with hints `+2h`/`+1d`/`+2d`/`+3d`, and they map to the existing `postponeTask(id, 1/12 | 1 | 2 | 3)`. For no-due items, "Show in Today"/"Show in Later" set `task.section`, then save and render; delete the old per-row `<select>`. "Edit repeat rule" toggles a `data-editing` flag that renders `createRepeatEditor(task)` under the row; restyle its classes to `.field` / `.btn` / `.daypick`. Completed tab: "Mark active" calls `toggleTask`. Delete is always last, after a `'sep'`, with `danger: true`.
- [ ] **Step 4: Rename.** Keep the existing double-click rename on `.row__title`, and change `title` to "Double-click to rename".
- [ ] **Step 5: Verify.** Run `node --test tests/` (pass). In the browser, both themes, at 360px and 1280px wide:
  1. A Today task with a passed time shows an orange time.
  2. Clicking the circle strikes the task through and swaps "…" for X.
  3. Clicking X removes the row, and the task is listed under Completed.
  4. Completing a repeating task shows one struck row today, and the next occurrence appears on its own date.
  5. On a dated task, "…" then "Tomorrow" moves it to the Tomorrow tab.
  6. Esc closes an open menu.
  7. No emoji anywhere: `document.body.innerText.match(/\p{Extended_Pictographic}/u)` gives `null`.
- [ ] **Step 6: Commit**
  ```bash
  git add script.mjs
  git commit -m "New task rows: complete circle, time column, action menus"
  ```

---

### Task 6: Header behaviors, sheet, counts, sign-out

**Files:**
- Modify: `script.mjs` (`setActiveTab` ~1034, the search listener, the export/import listeners, the sign-out block ~1259, `initialize`)

**Interfaces:**
- Consumes: `openMenu` (Task 5); `shouldOpenSheetOnKey` (Task 1); ids from Task 4.
- Produces: `openSheet(): void`, `closeSheet(): void`, `updateTabCounts(): void`, `updateDayHeading(): void`.

- [ ] **Step 1: Sheet.** `#new-item-button` and a document `keydown` that passes `shouldOpenSheetOnKey` call `openSheet()`. That function calls `showModal()`, focuses `#todo-input`, and syncs the `#type-task`/`#type-event` `aria-pressed` state. Close on `#sheet-cancel`, Esc (native), a backdrop click (a click whose target is the dialog itself), and after a successful submit (call `closeSheet()` at the end of the existing submit handler). Animation: the sheet slides up 180ms on widths ≤ 640px and is a centered dialog above that; skip the animation when the user prefers reduced motion.
- [ ] **Step 2: Search.** `#search-button` toggles `#search-toolbar` and focuses the input. In `setActiveTab`, remove the `tabName !== 'completed'` hiding, but keep clearing `searchQuery` on tab change. Esc in the input clears it and hides the toolbar.
- [ ] **Step 3: Account menu.** `#account-button` calls `openMenu` with Export JSON, Import JSON, `'sep'`, Sign out, keeping the existing clipboard handlers. Sign out calls `await signOut(auth)`, then `tasks = []`, `editingTaskId = null`, `setActiveTab('today')`, and shows `#sign-in-shell` / hides `#app-shell`. Also update the `onAuthStateChanged` and sign-in handlers to use the new ids instead of `.sign-in-shell` / `.app-shell`.
- [ ] **Step 4: Counts and heading.** `updateTabCounts()` computes, for each tab, the number of not-completed items `getItemsForTab` would return for it. Do this by temporarily setting `activeTab` and an empty `searchQuery`, then restoring both in `finally`. Write the results into `[data-count-for]`, hiding a count when it is 0. `updateDayHeading()` sets `#day-date` to the long weekday + month + day (e.g. "Tuesday, October 20"), `#day-title` to the tab label, and `#day-count` to `"N open · M done"`, or just `"N open"` when M is 0. Call both at the end of `renderTasks()`. The empty-state copy is "Nothing here." and it renders inside `.list`.
- [ ] **Step 5: Verify.** Run `node --test tests/` (pass). In the browser:
  1. N opens the sheet, but N typed into the search box or a rename input does not.
  2. Esc and a backdrop click close the sheet.
  3. Adding a weekly repeating task with Wed selected shows it on the Repeating tab with "Repeats every 1 week on Wed".
  4. Search filters on Today and on Later.
  5. Tab counts match the visible rows.
  6. Sign out returns to sign-in, and signing back in reloads the tasks from Firebase.
  7. Export, then Import, round-trips through the clipboard.
- [ ] **Step 6: Commit**
  ```bash
  git add script.mjs
  git commit -m "Header search, account menu, add sheet, tab counts, sign-out"
  ```

---

### Task 7: Docs and final pass

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README.** Replace "dark-mode browser" with "light/dark"; say that tasks sync via Firebase (remove the `localStorage` persistence claims) and that the theme preference is the only thing in `localStorage`; add `node --test tests/` under a "Tests" heading.
- [ ] **Step 2: Run the anti-pattern sweep.**
  `grep -nE "gradient|backdrop-filter|box-shadow" styles.css`. Expected: only the `.menu` and `.sheet` shadows, plus `0 0 0 1px` rings.
  `grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" index.html script.mjs icons.mjs`. Expected: nothing.
- [ ] **Step 3: Final run.** `node --test tests/` (all pass). Do a full manual run-through of Task 5 Step 5 and Task 6 Step 5 in both themes at 360px.
- [ ] **Step 4: Commit**
  ```bash
  git add README.md
  git commit -m "Update README for Graphite redesign"
  ```
