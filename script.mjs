const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const itemTypeSelect = document.getElementById('item-type');
const dueDateInput = document.getElementById('due-date');
const dueTimeInput = document.getElementById('due-time');
const startDateInput = document.getElementById('start-date');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const taskSectionSelect = document.getElementById('task-section');
const taskSectionField = document.getElementById('task-section-field');
const noDueCheckbox = document.getElementById('no-due');
const repeatTaskCheckbox = document.getElementById('repeat-task');
const repeatIntervalInput = document.getElementById('repeat-interval');
const repeatUnitSelect = document.getElementById('repeat-unit');
const repeatEndInput = document.getElementById('repeat-end');
const revealTimeInput = document.getElementById('repeat-time');
const repeatControls = document.getElementById('repeat-controls');
const repeatWeekdayField = document.getElementById('repeat-weekday-field');
const repeatMonthdayField = document.getElementById('repeat-monthday-field');
const repeatMonthdaysInput = document.getElementById('repeat-monthdays');
const repeatMonthPatternSelect = document.getElementById('repeat-month-pattern');
const repeatMonthDaysField = document.getElementById('repeat-month-days-field');
const repeatMonthWeekField = document.getElementById('repeat-month-week-field');
const repeatMonthWeekdayField = document.getElementById('repeat-month-weekday-field');
const repeatMonthWeekButtons = repeatMonthWeekField.querySelectorAll('[data-week]');
const repeatMonthWeekdayButtons = repeatMonthWeekdayField.querySelectorAll('[data-day]');
const taskSectionRow = document.getElementById('task-section-row');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const searchToolbar = document.getElementById('search-toolbar');
const searchInput = document.getElementById('search-input');
const tabButtons = document.querySelectorAll('.tab');
const taskFields = document.querySelectorAll('.item-task');
const eventFields = document.querySelectorAll('.item-event');
const revealTimeRow = document.getElementById('repeat-time-row');
const signInShell = document.getElementById('sign-in-shell');
const appShell = document.getElementById('app-shell');
const typeTaskButton = document.getElementById('type-task');
const typeEventButton = document.getElementById('type-event');
const searchButton = document.getElementById('search-button');
const accountButton = document.getElementById('account-button');
const newItemButton = document.getElementById('new-item-button');
const addSheet = document.getElementById('add-sheet');
const sheetCancelButton = document.getElementById('sheet-cancel');
const dayDate = document.getElementById('day-date');
const dayTitle = document.getElementById('day-title');
const dayCount = document.getElementById('day-count');
const newProjectButton = document.getElementById('new-project-button');
const projectRow = document.getElementById('project-row');
const projectSelect = document.getElementById('project-select');
const dateTabsSwitch = document.getElementById('date-tabs-switch');
const inDateTabsCheckbox = document.getElementById('in-date-tabs');
const alarmRow = document.getElementById('alarm-row');
const alarmControls = document.getElementById('alarm-controls');
const alarmTaskCheckbox = document.getElementById('alarm-task');
const alarmTimeInput = document.getElementById('alarm-time');

function initializeFirebase() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is securely logged in:", user.uid);
            currentUser = user;
            firebaseDb = getDatabase(app);
            // Update your UI or redirect to a dashboard here
            signInShell.classList.add('hidden');
            appShell.classList.remove('hidden');
            initialize();
            startSync();
        } else {
            currentUser = null;
            console.log("No authenticated user session found.");
        }
    });
    

    /*
    try {
        const credential = await signInAnonymously(auth);
        currentUser = credential.user;
        firebaseDb = getDatabase(app);
        console.log('Successfully signed in anonymously!', currentUser.uid);
        await startSync();
    } catch (error) {
        console.error('Error signing in:', error.code, error.message);
    }
    */
}

let searchQuery = '';
let editingTaskId = null;
let repeatEditorTaskId = null;

const STORAGE_KEY = 'todoapp-js-tasks';
let activeTab = 'today';
let tasks = [];
let projects = [];

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, set, get, push, update, onValue } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js';
import { showsInDateTab, resolveTheme, isOverdue, formatTimeCell, shouldOpenSheetOnKey, itemDate, itemTime, toIsoDate } from './view-logic.mjs';
import { icon } from './icons.mjs';
import { getChildProjects, getDescendantIds, flattenProjects, hasDate, isHiddenFromDateTabs, compareOrder, placeId, moveProjectTo } from './project-logic.mjs';
import { SCHEMA_VERSION, toStored, stableStringify, fromStored, fingerprint, diffCollection, migrateCollection, selectArchivable, buildArchiveUpdates } from './sync-logic.mjs';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyALjre1-AqZq16I8XYSkftsMaZSI8BJmXE",
    authDomain: "todoapp-js-5cbd2.firebaseapp.com",
    databaseURL: "https://todoapp-js-5cbd2-default-rtdb.firebaseio.com",
    projectId: "todoapp-js-5cbd2",
    storageBucket: "todoapp-js-5cbd2.firebasestorage.app",
    messagingSenderId: "942685119431",
    appId: "1:942685119431:web:0c05bb058ea8f45a5bafe2",
    measurementId: "G-89HYF364FQ"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let firebaseDb = null;
let user = null;
let currentUser = null;

initializeFirebase();

function getTodayIso() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function normalizeDate(value) {
    return value ? value.slice(0, 10) : getTodayIso();
}

function addInterval(dateIso, interval, unit) {
    const date = new Date(`${dateIso}T00:00:00`);
    switch (unit) {
        case 'week': startDate
            date.setDate(date.getDate() + interval * 7);
            break;
        case 'month':
            date.setMonth(date.getMonth() + interval);
            break;
        case 'year':
            date.setFullYear(date.getFullYear() + interval);
            break;
        default:
            date.setDate(date.getDate() + interval);
    }
    return date.toISOString().slice(0, 10);
}

function getDayDifference(dateIso) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const date = new Date(`${dateIso}T00:00:00`);
    const diffMs = date - today;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function daysBetween(startIso, endIso) {
    const start = new Date(`${startIso}T00:00:00`);
    const end = new Date(`${endIso}T00:00:00`);
    const diffMs = end - start;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function monthsBetween(startIso, endIso) {
    const start = new Date(`${startIso}T00:00:00`);
    const end = new Date(`${endIso}T00:00:00`);
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function parseMonthDays(value) {
    return Array.from(
        new Set(
            value
                .split(/[^0-9]+/)
                .map((item) => Number(item.trim()))
                .filter((num) => Number.isInteger(num) && num >= 1 && num <= 31)
        )
    ).sort((a, b) => a - b);
}

function isRepeatActive(rule, todayIso = getTodayIso()) {
    return !rule?.stopDate || rule.stopDate >= todayIso;
}

function getNthWeekdayDate(year, month, week, weekday) {
    const firstDay = new Date(year, month, 1);
    const day = 1 + ((weekday - firstDay.getDay() + 7) % 7) + (week - 1) * 7;
    const date = new Date(year, month, day);
    return date.getMonth() === month ? date : null;
}

function getSelectedValues(container, attribute) {
    const dataKey = attribute.slice(5);
    return Array.from(container.querySelectorAll(`.weekday-pill.selected[${attribute}]`)).map((button) => Number(button.dataset[dataKey]));
}

function formatTime(timeValue) {
    if (!timeValue) return '';
    const date = new Date(`1970-01-01T${timeValue}`);
    return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function unFormatTime(formattedTime, formattedDate) {
    if (!formattedDate) return 0;
    if (formattedTime === "") formattedTime = "00:00";
    return Date.parse(`${formattedDate}T${formattedTime}:00Z`);
}

function formatDueLabel(item) {
    if (item.type === 'event') {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const startDate = new Date(`${item.startDate}T00:00:00`);
        const formattedDate = startDate.toLocaleDateString(undefined, options);
        return `${formattedDate} · ${formatTime(item.startTime)} - ${formatTime(item.endTime)}`;
    }

    if (item.noDue) {
        return 'No due date';
    }

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const dueDate = new Date(`${item.dueDate}T00:00:00`);
    const formattedDate = dueDate.toLocaleDateString(undefined, options);
    const timeSuffix = item.dueTime ? ` · ${formatTime(item.dueTime)}` : '';

    return `${formattedDate}${timeSuffix}`;
}

function formatRepeatLabel(rule) {
    const labels = [`Repeats every ${rule.interval} ${rule.unit}`];
    if (rule.revealTime) {
        labels.push(`at ${formatTime(rule.revealTime)}`);
    }
    if (rule.unit === 'week' && rule.daysOfWeek?.length) {
        const names = rule.daysOfWeek.map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]);
        labels.push(`on ${names.join(', ')}`);
    }
    if (rule.unit === 'month' && rule.daysOfMonth?.length) {
        labels.push(`on ${rule.daysOfMonth.join(', ')}`);
    }
    if (rule.unit === 'month' && rule.monthPattern === 'weekday') {
        const weekNames = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weeks = Array.isArray(rule.monthWeeks) ? rule.monthWeeks : [rule.monthWeek || 1];
        const weekdays = Array.isArray(rule.monthWeekdays) ? rule.monthWeekdays : [rule.monthWeekday || 0];
        labels.push(`on the ${weeks.map((week) => weekNames[week]).join(' or ')} ${weekdays.map((day) => dayNames[day]).join(' or ')}`);
    }
    return labels.join(' ');
}

// Firebase push keys: unique across devices and ordered by creation time. They double as record ids.
function createTaskId() {
    if (firebaseDb) return push(ref(firebaseDb)).key;
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function userRef(path = '') {
    return ref(firebaseDb, path ? `users/${currentUser.uid}/${path}` : `users/${currentUser.uid}`);
}

// Fingerprints of what the database last held, by id. Saves write only the records that differ from them,
// and listener events that match them are echoes of this page's own writes.
const synced = { tasks: new Map(), projects: new Map() };
const loaded = { tasks: false, projects: false };
let syncUnsubscribers = [];

function saveTasks() {
    writeChanges('tasks', tasks);
}

function saveProjects() {
    writeChanges('projects', projects);
}

function writeChanges(collectionName, items) {
    if (!firebaseDb || !currentUser || !loaded[collectionName]) return;
    const { updates, next } = diffCollection(collectionName, synced[collectionName], items);
    if (!Object.keys(updates).length) return;

    // Recorded before writing: the SDK fires the local listener event synchronously inside update().
    synced[collectionName] = next;
    update(userRef(), updates).catch((error) => console.warn(`Firebase ${collectionName} save failed`, error));
}

// New tasks take their key from push(), then write to that key.
function pushTask(item) {
    if (!firebaseDb || !currentUser || !loaded.tasks) {
        item.id = createTaskId();
        tasks.push(item);
        return;
    }

    const taskRef = push(userRef('tasks'));
    const stored = toStored(item);
    item.id = taskRef.key;
    tasks.push(item);
    synced.tasks.set(item.id, stableStringify(stored));
    set(taskRef, stored).catch((error) => console.warn('Firebase task add failed', error));
}

// Firebase drops null fields, so rebuild each project's shape.
function normalizeProjects(data) {
    if (!Array.isArray(data)) return [];
    return data
        .filter((project) => project && project.id && typeof project.name === 'string')
        .map((project) => ({
            id: project.id,
            name: project.name,
            parentId: project.parentId || null,
            ...(Number.isFinite(project.order) ? { order: project.order } : {}),
        }));
}

// On every load: bring an old array-shaped user node up to the keyed layout, then listen for changes from any
// device. The first task snapshot also moves year-old completed items into the archive.
async function startSync() {
    if (!firebaseDb || !currentUser) return;
    stopSync();

    try {
        const version = await get(userRef('schemaVersion'));
        if ((version.val() || 0) < SCHEMA_VERSION) await migrateUserNode();
    } catch (error) {
        console.warn('Firebase load failed', error);
        return;
    }

    let archiveChecked = false;
    syncUnsubscribers = [
        onValue(userRef('projects'), (snapshot) => applyRemote('projects', snapshot.val()),
            (error) => console.warn('Firebase project listener failed', error)),
        onValue(userRef('tasks'), (snapshot) => {
            applyRemote('tasks', snapshot.val());
            if (!archiveChecked) {
                archiveChecked = true;
                archiveOldTasks();
            }
        }, (error) => console.warn('Firebase task listener failed', error)),
    ];
}

function stopSync() {
    syncUnsubscribers.forEach((unsubscribe) => unsubscribe());
    syncUnsubscribers = [];
    synced.tasks = new Map();
    synced.projects = new Map();
    loaded.tasks = false;
    loaded.projects = false;
}

async function migrateUserNode() {
    const [taskSnapshot, projectSnapshot] = await Promise.all([get(userRef('tasks')), get(userRef('projects'))]);
    // One update replaces both collections and stamps the version, so a half-migrated node can't happen.
    await update(userRef(), {
        tasks: migrateCollection(taskSnapshot.val(), createTaskId),
        projects: migrateCollection(projectSnapshot.val(), createTaskId),
        schemaVersion: SCHEMA_VERSION,
    });
}

function sameFingerprint(a, b) {
    if (a.size !== b.size) return false;
    for (const [id, print] of a) {
        if (b.get(id) !== print) return false;
    }
    return true;
}

let remigrating = false;

function applyRemote(collectionName, value) {
    // A tab still running the old code writes whole arrays back; re-key them rather than reading indexes as ids.
    if (Array.isArray(value)) {
        if (!remigrating) {
            remigrating = true;
            migrateUserNode()
                .catch((error) => console.warn('Firebase migration failed', error))
                .finally(() => { remigrating = false; });
        }
        return;
    }

    const records = fromStored(value);
    const print = fingerprint(records);
    const firstLoad = !loaded[collectionName];
    loaded[collectionName] = true;
    if (!firstLoad && sameFingerprint(print, synced[collectionName])) return;

    synced[collectionName] = print;
    if (collectionName === 'tasks') tasks = records;
    else projects = normalizeProjects(records);
    renderWhenIdle();
}

function archiveOldTasks() {
    const todayIso = getTodayIso();
    const old = selectArchivable(tasks, todayIso);
    if (!old.length) return;

    const ids = new Set(old.map((item) => item.id));
    tasks = tasks.filter((item) => !ids.has(item.id));
    ids.forEach((id) => synced.tasks.delete(id));
    update(userRef(), buildArchiveUpdates(old, todayIso)).catch((error) => console.warn('Firebase archive failed', error));
    renderWhenIdle();
}

async function exportArchive() {
    try {
        const snapshot = await get(userRef('archive'));
        const archive = fromStored(snapshot.val());
        if (!archive.length) {
            alert('The archive is empty.');
            return;
        }
        await navigator.clipboard.writeText(JSON.stringify({ archive }, null, 2));
        alert(`${archive.length} archived items copied to clipboard`);
    } catch (error) {
        alert('Unable to copy the archive. Please allow clipboard access and try again.');
    }
}

function matchesRepeatRule(item, dateIso, rule, anchorIso) {
    const date = new Date(`${dateIso}T00:00:00`);
    const anchor = new Date(`${anchorIso}T00:00:00`);
    const diffDays = daysBetween(anchorIso, dateIso);
    if (diffDays < 0) return false;

    switch (rule.unit) {
        case 'day':
            return diffDays % rule.interval === 0;
        case 'week': {
            if (!rule.daysOfWeek?.length) return false;
            const weekday = date.getDay();
            if (!rule.daysOfWeek.includes(weekday)) return false;
            const weeks = Math.floor(diffDays / 7);
            return weeks % rule.interval === 0;
        }
        case 'month': {
            if (monthsBetween(anchorIso, dateIso) % rule.interval !== 0) return false;
            if (rule.monthPattern === 'weekday') {
                const weeks = Array.isArray(rule.monthWeeks) ? rule.monthWeeks : [rule.monthWeek || 1];
                const weekdays = Array.isArray(rule.monthWeekdays) ? rule.monthWeekdays : [rule.monthWeekday || 0];
                return weeks.some((week) => weekdays.some((weekday) => {
                    const occurrence = getNthWeekdayDate(date.getFullYear(), date.getMonth(), Number(week), Number(weekday));
                    return occurrence?.getDate() === date.getDate();
                }));
            }
            return rule.daysOfMonth?.includes(date.getDate()) || false;
        }
        case 'year':
            return (
                date.getMonth() === anchor.getMonth() &&
                date.getDate() === anchor.getDate() &&
                diffDays >= 0 &&
                (date.getFullYear() - anchor.getFullYear()) % rule.interval === 0
            );
        default:
            return false;
    }
}

function getCategory(item) {
    if (item.completed) {
        return 'completed';
    }

    const today = getTodayIso();
    const tomorrow = addInterval(today, 1, 'day');
    const dayThree = addInterval(today, 3, 'day');
    const dateIso = item.type === 'event' ? item.startDate : item.dueDate;

    if (item.noDue) {
        return item.section || 'later';
    }

    if (!dateIso) {
        return 'later';
    }

    if (dateIso <= today) {
        return 'today';
    }

    if (dateIso === tomorrow) {
        return 'tomorrow';
    }

    if (dateIso <= dayThree) {
        return 'next3';
    }

    return 'later';
}

function createRepeatEditor(task) {
    const editor = document.createElement('div');
    editor.className = 'repeat-editor';

    const content = document.createElement('div');
    content.className = 'repeat-editor-content';

    const intervalField = document.createElement('div');
    intervalField.className = 'field';
    intervalField.innerHTML = `
    <label>Repeat every</label>
    <div class="field-inline">
      <input type="number" min="1" class="edit-repeat-interval" value="${task.repeatRule.interval}" />
      <select class="edit-repeat-unit">
        <option value="day">day(s)</option>
        <option value="week">week(s)</option>
        <option value="month">month(s)</option>
        <option value="year">year(s)</option>
      </select>
    </div>
  `;
    const editUnitSelect = intervalField.querySelector('.edit-repeat-unit');
    editUnitSelect.value = task.repeatRule.unit;

    const stopField = document.createElement('div');
    stopField.className = 'field';
    stopField.innerHTML = `
    <label>Stop repeating</label>
    <input type="date" class="edit-repeat-stop" value="${task.repeatRule.stopDate || ''}" />
  `;

    const timeField = document.createElement('div');
    timeField.className = 'field';
    timeField.innerHTML = `
    <label>Reveal time <span>(optional)</span></label>
    <input type="time" class="edit-repeat-time" value="${task.repeatRule.revealTime || ''}" />
  `;

    const alarmField = document.createElement('div');
    alarmField.className = 'field';
    alarmField.innerHTML = `
    <label>Alarm time <span>(optional)</span></label>
    <input type="time" class="edit-repeat-alarm" value="${task.alarmTime || ''}" />
  `;

    const weekdayField = document.createElement('div');
    weekdayField.className = 'field edit-weekday-field hidden';
    const selectedWeekdays = task.repeatRule.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6];
    weekdayField.innerHTML = `
    <label>Repeat on</label>
    <div class="weekday-pill-grid">
      ${[0, 1, 2, 3, 4, 5, 6]
            .map(
                (day) =>
                    `<button type="button" class="weekday-pill ${selectedWeekdays.includes(day) ? 'selected' : ''}" data-day="${day}">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}</button>`
            )
            .join('')}
    </div>
  `;

    const monthdayField = document.createElement('div');
    monthdayField.className = 'field edit-monthday-field hidden';
    monthdayField.innerHTML = `
    <label>Days of month</label>
    <input type="text" class="edit-repeat-monthdays" value="${(task.repeatRule.daysOfMonth || []).join(', ')}" placeholder="e.g. 1, 15, 28" />
  `;

    const footer = document.createElement('div');
    footer.className = 'repeat-editor-footer';

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'btn';
    saveButton.textContent = 'Save repeat rule';
    saveButton.addEventListener('click', () => {
        const intervalValue = Number(intervalField.querySelector('.edit-repeat-interval').value) || 1;
        const unitValue = editUnitSelect.value;
        const stopValue = stopField.querySelector('.edit-repeat-stop').value;
        const revealTimeValue = timeField.querySelector('.edit-repeat-time').value;
        const weekDays = Array.from(weekdayField.querySelectorAll('.weekday-pill.selected')).map((button) => Number(button.dataset.day));
        task.repeatRule = {
            interval: intervalValue,
            unit: unitValue,
            stopDate: stopValue || '',
            revealTime: revealTimeValue || '',
            daysOfWeek: weekDays,
            daysOfMonth: parseMonthDays(monthdayField.querySelector('.edit-repeat-monthdays').value),
            monthPattern: task.repeatRule.monthPattern || 'days',
            monthWeeks: task.repeatRule.monthWeeks || [task.repeatRule.monthWeek || 1],
            monthWeekdays: task.repeatRule.monthWeekdays || [task.repeatRule.monthWeekday || 0],
        };

        const alarmValue = alarmField.querySelector('.edit-repeat-alarm').value;
        if (alarmValue) task.alarmTime = alarmValue;
        else delete task.alarmTime;

        repeatEditorTaskId = null;
        saveTasks();
        renderTasks();
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn btn-ghost btn-danger-text';
    removeButton.textContent = 'Remove repeat rule';
    removeButton.addEventListener('click', () => {
        repeatEditorTaskId = null;
        task.repeatRule = null;
        saveTasks();
        renderTasks();
    });

    footer.append(removeButton, saveButton);
    content.append(intervalField, stopField, timeField, alarmField, weekdayField, monthdayField, footer);
    editor.appendChild(content);

    editUnitSelect.addEventListener('change', () => {
        const unit = editUnitSelect.value;
        weekdayField.classList.toggle('hidden', unit !== 'week');
        monthdayField.classList.toggle('hidden', unit !== 'month');
    });

    weekdayField.addEventListener('click', (event) => {
        const button = event.target.closest('.weekday-pill');
        if (!button) return;
        button.classList.toggle('selected');
    });

    if (task.type === 'event') {
        timeField.classList.add('hidden');
    }

    editUnitSelect.dispatchEvent(new Event('change'));

    return editor;
}

function createRepeatOccurrence(task, dateIso) {
    if (task.type === 'event') {
        return {
            ...task,
            id: `${task.id}-occ-${dateIso}`,
            startDate: dateIso,
            startTime: task.startTime || '',
            endTime: task.endTime || '',
            isVirtual: true,
        };
    }

    return {
        ...task,
        id: `${task.id}-occ-${dateIso}`,
        dueDate: dateIso,
        dueTime: task.dueTime || '',
        isVirtual: true,
    };
}

function getRepeatOccurrences(task, startIso, endIso) {
    if (!task.repeatRule || task.completed || !isRepeatActive(task.repeatRule)) return [];

    const rule = task.repeatRule;
    const anchorIso = task.type === 'event' ? task.startDate : task.dueDate || startIso;
    const startDate = new Date(`${startIso}T00:00:00`);
    const endDate = new Date(`${endIso}T23:59:59`);
    const candidate = new Date(Math.max(new Date(`${anchorIso}T00:00:00`).getTime(), startDate.getTime()));
    const occurrences = [];

    while (candidate <= endDate) {
        const iso = candidate.toISOString().slice(0, 10);
        if (candidate >= new Date(`${anchorIso}T00:00:00`) && iso !== anchorIso && matchesRepeatRule(task, iso, rule, anchorIso)) {
            if (rule.stopDate && iso > rule.stopDate) break;
            occurrences.push(createRepeatOccurrence(task, iso));
        }
        candidate.setDate(candidate.getDate() + 1);
    }

    return occurrences;
}

function getNextValidStartDate(startIso, rule, item) {
    const anchorIso = startIso;
    let candidate = new Date(`${startIso}T00:00:00`);
    while (true) {
        const iso = candidate.toISOString().slice(0, 10);
        if (matchesRepeatRule(item, iso, rule, anchorIso)) {
            return iso;
        }
        candidate.setDate(candidate.getDate() + 1);
    }
}

function getItemsForTab() {
    let items;

    // console.log('Active tab:', activeTab, 'Search query:', searchQuery);

    if (activeTab === 'repeating') {
        items = tasks.filter((item) => item.repeatRule && isRepeatActive(item.repeatRule) && !item.isVirtual);
    } else if (activeTab === 'projects') {
        const projectIds = getProjectIds();
        const todayIso = getTodayIso();
        // Like the Next 3 days tab, anything dated further out stays hidden until it gets closer.
        const horizon = addInterval(todayIso, 3, 'day');
        items = tasks.filter((item) => !item.isVirtual
            && projectIds.has(item.projectId)
            && showsInDateTab(item, todayIso)
            && (!hasDate(item) || itemDate(item) <= horizon));
    } else {
        const todayIso = getTodayIso();
        const baseItems = tasks.filter((item) => {
            if (!item.completed || activeTab === 'completed') return getCategory(item) === activeTab;
            return showsInDateTab(item, todayIso) && getCategory({ ...item, completed: false }) === activeTab;
        });

        if (activeTab === 'tomorrow' || activeTab === 'next3') {
            const today = getTodayIso();
            const tomorrow = addInterval(today, 1, 'day');
            const rangeEnd = activeTab === 'tomorrow' ? tomorrow : addInterval(today, 3, 'day');
            const virtuals = tasks.flatMap((item) => getRepeatOccurrences(item, tomorrow, rangeEnd));
            items = [...baseItems, ...virtuals];
        } else if (activeTab === 'nextMonth') {
            const today = getTodayIso();
            const rangeEnd = addInterval(today, 1, 'month');
            const eventItems = tasks.filter((item) => {
                if (!showsInDateTab(item, today) || item.isVirtual || item.type !== 'event') return false;
                const dateIso = item.startDate;
                return Boolean(dateIso && dateIso >= today && dateIso <= rangeEnd);
            });
            const virtuals = tasks.flatMap((item) => getRepeatOccurrences(item, today, rangeEnd)).filter((item) => item.type === 'event');
            items = [...eventItems, ...virtuals];
        } else if (activeTab === 'later') {
            items = tasks.filter((item) => item.type === 'task' && ((item.noDue && item.section === 'later') || (!item.noDue && !item.repeatRule)) && showsInDateTab(item, todayIso));
            items.sort((a, b) => {
                if (a.noDue && !b.noDue) return -1;
                if (!a.noDue && b.noDue) return 1;
                if (a.dueDate && b.dueDate) {
                    if (a.dueDate < b.dueDate) return -1;
                    if (a.dueDate > b.dueDate) return 1;
                    if (a.dueTime && b.dueTime) {
                        if (a.dueTime < b.dueTime) return -1;
                        if (a.dueTime > b.dueTime) return 1;
                    }
                }
                return 0;
            });
        } else if (activeTab === 'today') {
            items = tasks.filter((item) => {
                const now = new Date();
                if (item.minShowTime && item.minShowTime > now) return false;
                if (!showsInDateTab(item, todayIso)) return false;
                if (unFormatTime(item.dueTime || '', item.dueDate || '') > unFormatTime("23:59", getTodayIso())) return false;
                if (unFormatTime(item.startTime || '', item.startDate || '') > unFormatTime("23:59", getTodayIso())) return false;
                if (item.section === 'later') return false;
                const localTimestamp = Date.now() - (new Date().getTimezoneOffset() * 60000);
                if (typeof item.repeatRule?.revealTime === 'string' && item.repeatRule?.revealTime !== "" && unFormatTime(item.repeatRule.revealTime, item.dueDate) > localTimestamp) return false;
                return true;
            });
        } else {
            items = baseItems;
        }

        if (activeTab !== 'completed') {
            const projectIds = getProjectIds();
            items = items.filter((item) => !isHiddenFromDateTabs(item, projectIds));
        }
    }

    if (!searchQuery.trim()) {
        return items;
    }

    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => item.text.toLowerCase().includes(query));
}

const editableTabs = new Set(['today', 'tomorrow', 'next3', 'nextMonth', 'later', 'projects']);

function canRenameTask(task) {
    return editableTabs.has(activeTab) && !task.isVirtual && !task.completed;
}

function beginTaskRename(taskId) {
    editingTaskId = taskId;
    renderTasks();
}

function cancelTaskRename() {
    editingTaskId = null;
    renderTasks();
}

function commitTaskRename(taskId, nextText) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
        editingTaskId = null;
        renderTasks();
        return;
    }

    const trimmedText = nextText.trim();
    if (trimmedText) {
        task.text = trimmedText;
        saveTasks();
    }

    editingTaskId = null;
    renderTasks();
}

const TAB_LABELS = {
    today: 'Today',
    tomorrow: 'Tomorrow',
    next3: 'Next 3 days',
    nextMonth: 'Next month',
    later: 'Later',
    projects: 'Projects',
    repeating: 'Repeating',
    completed: 'Completed',
};

function renderTasks() {
    closeMenu({ restoreFocus: false });
    renderList();
    updateTabCounts();
    updateDayHeading();
}

function updateTabCounts() {
    const savedTab = activeTab;
    const savedQuery = searchQuery;
    try {
        searchQuery = '';
        document.querySelectorAll('[data-count-for]').forEach((element) => {
            activeTab = element.dataset.countFor;
            const count = activeTab === 'completed' ? 0 : getItemsForTab().filter((item) => !item.completed).length;
            element.textContent = count > 0 ? String(count) : '';
        });
    } finally {
        activeTab = savedTab;
        searchQuery = savedQuery;
    }
}

function updateDayHeading() {
    dayDate.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    dayTitle.textContent = TAB_LABELS[activeTab] || '';

    if (activeTab === 'projects') {
        // Collapsed projects leave their tasks unrendered, so count from the data instead of the rows.
        const items = getItemsForTab();
        const done = items.filter((item) => item.completed).length;
        const open = items.length - done;
        dayCount.textContent = done > 0 ? `${open} open · ${done} done` : `${open} open`;
        return;
    }

    const rows = Array.from(todoList.querySelectorAll('.row'));
    const done = rows.filter((row) => row.classList.contains('row--done')).length;
    const open = rows.length - done;
    if (activeTab === 'completed') {
        dayCount.textContent = `${done} done`;
    } else if (activeTab === 'repeating') {
        dayCount.textContent = `${rows.length} active`;
    } else {
        dayCount.textContent = done > 0 ? `${open} open · ${done} done` : `${open} open`;
    }
}

function renderList() {
    expireStoppedRepeats();
    todoList.innerHTML = '';
    todoList.classList.toggle('list--tree', activeTab === 'projects');
    emptyState.textContent = activeTab === 'projects' && projects.length === 0 ? 'No projects yet.' : 'Nothing here.';

    if (activeTab === 'projects') {
        renderProjectTree();
        return;
    }

    let visibleTasks;

    // sort by due date and time
    if (activeTab === 'completed') {
        visibleTasks = getItemsForTab().sort((a, b) => {
            const aTime = unFormatTime(a.dueTime ?? a.startTime, a.dueDate ?? a.startDate ?? getTodayIso());
            const bTime = unFormatTime(b.dueTime ?? b.startTime, b.dueDate ?? b.startDate ?? getTodayIso());
            return bTime - aTime;
        });
    } else {
        visibleTasks = getItemsForTab().sort((a, b) => {
            return unFormatTime(a.dueTime ?? a.startTime, a.dueDate ?? a.startDate ?? getTodayIso()) - unFormatTime(b.dueTime ?? b.startTime, b.dueDate ?? b.startDate ?? getTodayIso());
        });
    }

    if (visibleTasks.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    if (activeTab !== 'completed') {
        // Struck-through items sink below the open ones (stable sort keeps time order within each group).
        visibleTasks.sort((a, b) => Number(Boolean(a.completed)) - Number(Boolean(b.completed)));
    }

    const now = new Date();

    visibleTasks.forEach((task) => {
        if (activeTab === 'repeating' && task.repeatRule && !task.repeatRule.interval) return;
        todoList.appendChild(createTaskRow(task, now));
    });
}

function getProjectIds() {
    return new Set(projects.map((project) => project.id));
}

const COLLAPSED_KEY = 'todo-collapsed-projects';
const collapsedProjects = loadCollapsedProjects();

function loadCollapsedProjects() {
    try {
        return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY)) || []);
    } catch (error) {
        return new Set();
    }
}

function setProjectCollapsed(projectId, collapsed) {
    if (collapsed) collapsedProjects.add(projectId);
    else collapsedProjects.delete(projectId);
    try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsedProjects]));
    } catch (error) {
        // Storage can be unavailable (private mode); the tree still toggles for this visit.
    }
}

// Open items first, struck-through items at the bottom. Within each group, the order set by dragging, then by
// date (undated last) for tasks that were never dragged.
function sortProjectTasks(items) {
    const sortKey = (item) => (hasDate(item)
        ? unFormatTime(item.dueTime ?? item.startTime, item.dueDate ?? item.startDate ?? getTodayIso())
        : Infinity);
    return [...items].sort((a, b) => Number(Boolean(a.completed)) - Number(Boolean(b.completed))
        || compareOrder(a.projectOrder, b.projectOrder)
        || sortKey(a) - sortKey(b));
}

function renderProjectTree() {
    const items = getItemsForTab();
    const query = searchQuery.trim().toLowerCase();
    const tasksByProject = new Map();
    items.forEach((item) => {
        if (!tasksByProject.has(item.projectId)) tasksByProject.set(item.projectId, []);
        tasksByProject.get(item.projectId).push(item);
    });

    // While searching, keep only projects that match by name or hold a matching task somewhere below.
    const matches = (project) => !query
        || project.name.toLowerCase().includes(query)
        || tasksByProject.has(project.id)
        || getChildProjects(projects, project.id).some(matches);
    const now = new Date();

    const renderLevel = (parentId, depth) => {
        getChildProjects(projects, parentId).filter(matches).forEach((project) => {
            const subtree = [project.id, ...getDescendantIds(projects, project.id)];
            const openCount = subtree.flatMap((id) => tasksByProject.get(id) || []).filter((item) => !item.completed).length;
            const expanded = Boolean(query) || !collapsedProjects.has(project.id);
            todoList.appendChild(createProjectHead(project, depth, openCount, expanded));
            if (!expanded) return;

            sortProjectTasks(tasksByProject.get(project.id) || []).forEach((task) => {
                const row = createTaskRow(task, now);
                row.style.setProperty('--depth', depth + 1);
                row.dataset.taskId = task.id;
                row.dataset.ownerProjectId = project.id;
                todoList.appendChild(row);
            });
            renderLevel(project.id, depth + 1);
        });
    };
    renderLevel(null, 0);

    emptyState.style.display = todoList.children.length ? 'none' : 'block';
}

function createProjectHead(project, depth, openCount, expanded) {
    const row = document.createElement('li');
    row.className = 'row project-head';
    row.dataset.projectId = project.id;
    row.style.setProperty('--depth', depth);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'project-head__toggle';
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.innerHTML = `<span class="row__lead">${icon('chevron')}</span><span class="project-head__name">${escapeHtml(project.name)}</span>`;
    toggle.addEventListener('click', () => toggleProject(project.id, row, expanded));
    row.appendChild(toggle);

    const count = document.createElement('span');
    count.className = 'row__time';
    count.textContent = openCount > 0 ? String(openCount) : '';
    row.appendChild(count);

    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'icon-btn icon-btn--ghost row__trail';
    menuButton.innerHTML = icon('more');
    menuButton.setAttribute('aria-label', `${project.name} actions`);
    menuButton.setAttribute('aria-haspopup', 'menu');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.addEventListener('click', () => openMenu(menuButton, getProjectMenuItems(project, menuButton)));
    row.appendChild(menuButton);

    return row;
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let projectToggleBusy = false;

// The tree is flat <li>s, so a project's rows are the ones after its head that sit deeper than it.
function getProjectRows(head) {
    const depth = Number(head.style.getPropertyValue('--depth'));
    const rows = [];
    for (let row = head.nextElementSibling; row && Number(row.style.getPropertyValue('--depth')) > depth; row = row.nextElementSibling) {
        rows.push(row);
    }
    return rows;
}

// Grows a row from nothing to its natural size, so the rows below slide instead of jumping.
function rowGrowKeyframes(row) {
    const style = getComputedStyle(row);
    return [
        { height: '0px', minHeight: '0px', paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', opacity: 0, transform: 'translateY(-10px) scale(0.98)', filter: 'blur(2px)' },
        { height: `${row.offsetHeight}px`, minHeight: style.minHeight, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, borderTopWidth: style.borderTopWidth, opacity: 1, transform: 'none', filter: 'none' },
    ];
}

function animateRows(rows, { opening }) {
    return Promise.all(rows.map((row, index) => {
        const order = opening ? index : rows.length - 1 - index;
        const keyframes = rowGrowKeyframes(row);
        row.style.overflow = 'hidden';
        const animation = row.animate(opening ? keyframes : keyframes.reverse(), {
            duration: opening ? 320 : 220,
            delay: Math.min(order, 10) * (opening ? 28 : 16),
            easing: opening ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.5, 0, 0.75, 0)',
            fill: opening ? 'backwards' : 'forwards',
        });
        return animation.finished.catch(() => {}).finally(() => {
            if (opening) row.style.overflow = '';
        });
    }));
}

async function toggleProject(projectId, head, expanded) {
    if (projectToggleBusy) return;
    const animate = !reducedMotion.matches;

    if (expanded && animate) {
        // Flip the chevron now (CSS transition) and fold the rows away before re-rendering without them.
        projectToggleBusy = true;
        head.querySelector('.project-head__toggle').setAttribute('aria-expanded', 'false');
        await animateRows(getProjectRows(head), { opening: false });
        projectToggleBusy = false;
    }

    setProjectCollapsed(projectId, expanded);
    renderTasks();

    const newHead = todoList.querySelector(`[data-project-id="${CSS.escape(projectId)}"]`);
    if (!newHead) return;
    const toggle = newHead.querySelector('.project-head__toggle');
    toggle.focus({ preventScroll: true });

    if (!expanded && animate) {
        toggle.querySelector('svg').animate(
            [{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }],
            { duration: 360, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
        );
        animateRows(getProjectRows(newHead), { opening: true });
    }
}

// ---------- Drag to reorder (Projects tab) ----------
// Mouse: press and move. Touch and pen: press and hold, then move. A project carries its whole sub-tree.
// Tasks drop between tasks (or onto a project head, landing first in it); projects drop before or after another
// project, or onto its middle to nest inside it. The resulting order is saved with the records.
const DRAG_HOLD_MS = 280;
const DRAG_SLOP_PX = 6;
const DRAG_EDGE_PX = 64;
let pendingDrag = null; // a press that may still turn into a drag
let drag = null; // the drag in progress

function rowDepth(row) {
    return Number(row.style.getPropertyValue('--depth')) || 0;
}

todoList.addEventListener('pointerdown', (event) => {
    if (activeTab !== 'projects' || searchQuery.trim() || drag || pendingDrag) return;
    if (!event.isPrimary || event.button !== 0) return;
    const row = event.target.closest('.row');
    if (!row || (!row.dataset.projectId && !row.dataset.taskId)) return;
    if (event.target.closest('input, textarea, select, .row__editor')) return;

    pendingDrag = {
        row,
        pointerId: event.pointerId,
        touch: event.pointerType !== 'mouse',
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        timer: null,
    };
    if (pendingDrag.touch) pendingDrag.timer = setTimeout(beginDrag, DRAG_HOLD_MS);
});

document.addEventListener('pointermove', (event) => {
    if (pendingDrag && event.pointerId === pendingDrag.pointerId) {
        pendingDrag.lastX = event.clientX;
        pendingDrag.lastY = event.clientY;
        if (Math.hypot(event.clientX - pendingDrag.startX, event.clientY - pendingDrag.startY) <= DRAG_SLOP_PX) return;
        // A finger that moves before the hold is up is scrolling, not dragging.
        if (pendingDrag.touch) cancelPendingDrag();
        else beginDrag();
    }
    if (drag && event.pointerId === drag.pointerId) {
        event.preventDefault();
        drag.pointerX = event.clientX;
        drag.pointerY = event.clientY;
        updateDrag();
    }
});

document.addEventListener('pointerup', (event) => {
    if (pendingDrag && event.pointerId === pendingDrag.pointerId) cancelPendingDrag();
    if (drag && event.pointerId === drag.pointerId) endDrag(true);
});

document.addEventListener('pointercancel', (event) => {
    if (pendingDrag && event.pointerId === pendingDrag.pointerId) cancelPendingDrag();
    if (drag && event.pointerId === drag.pointerId) endDrag(false);
});

document.addEventListener('keydown', (event) => {
    if (drag && event.key === 'Escape') {
        event.preventDefault();
        endDrag(false);
    }
});

// Once a drag has started, the finger moves the row instead of the page.
document.addEventListener('touchmove', (event) => {
    if (drag) event.preventDefault();
}, { passive: false });

// A long press would otherwise open the browser's context menu or text callout.
todoList.addEventListener('contextmenu', (event) => {
    if (drag || pendingDrag) event.preventDefault();
});

function cancelPendingDrag() {
    if (!pendingDrag) return;
    clearTimeout(pendingDrag.timer);
    pendingDrag = null;
}

function beginDrag() {
    const { row, pointerId, lastX, lastY } = pendingDrag;
    cancelPendingDrag();
    if (!row.isConnected) return;
    closeMenu({ restoreFocus: false });

    const isProject = Boolean(row.dataset.projectId);
    const rect = row.getBoundingClientRect();
    const ghost = row.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.left = `${rect.left}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.paddingLeft = getComputedStyle(row).paddingLeft;
    const indicator = document.createElement('div');
    indicator.className = 'drop-line';
    indicator.hidden = true;
    document.body.append(ghost, indicator);

    const rows = isProject ? [row, ...getProjectRows(row)] : [row];
    rows.forEach((item) => item.classList.add('row--dragging'));
    document.body.classList.add('is-dragging');
    window.getSelection()?.removeAllRanges();
    navigator.vibrate?.(12);

    drag = {
        isProject,
        id: isProject ? row.dataset.projectId : row.dataset.taskId,
        rows: new Set(rows),
        ghost,
        indicator,
        pointerId,
        offsetY: lastY - rect.top,
        startX: lastX,
        pointerX: lastX,
        pointerY: lastY,
        left: rect.left,
        maxShift: rect.width / 3,
        depth: rowDepth(row),
        target: null,
        scrollFrame: requestAnimationFrame(autoScrollDrag),
    };
    updateDrag();
}

// Near the top or bottom edge of the window, scroll so a row can travel past what's on screen.
function autoScrollDrag() {
    if (!drag) return;
    const headerBottom = document.querySelector('.app-header')?.getBoundingClientRect().bottom || 0;
    const top = Math.max(headerBottom, 0) + DRAG_EDGE_PX;
    const bottom = window.innerHeight - DRAG_EDGE_PX;
    let step = 0;
    if (drag.pointerY < top) step = -Math.ceil((top - drag.pointerY) / 4);
    else if (drag.pointerY > bottom) step = Math.ceil((drag.pointerY - bottom) / 4);
    if (step) {
        window.scrollBy(0, Math.max(-24, Math.min(24, step)));
        updateDrag();
    }
    drag.scrollFrame = requestAnimationFrame(autoScrollDrag);
}

function updateDrag() {
    drag.ghost.style.top = `${drag.pointerY - drag.offsetY}px`;
    // A project's ghost follows the pointer sideways too, since that picks the nesting level.
    if (drag.isProject) {
        const shift = Math.max(-drag.maxShift, Math.min(drag.maxShift, drag.pointerX - drag.startX));
        drag.ghost.style.left = `${drag.left + shift}px`;
    }
    drag.target = findDropTarget(drag.pointerY);
    showDropTarget(drag.target);
}

// The row under y and how far down it y sits (0–1). Above or below the list, the nearest end row.
// Rows being dragged don't count; over them there is no target.
function rowAtY(y) {
    const rows = Array.from(todoList.children).filter((row) => row.classList.contains('row') && !drag.rows.has(row));
    if (!rows.length) return null;
    if (y < rows[0].getBoundingClientRect().top) return { row: rows[0], fraction: 0 };
    for (const row of rows) {
        const rect = row.getBoundingClientRect();
        if (y >= rect.top && y < rect.bottom) return { row, fraction: (y - rect.top) / rect.height };
    }
    const last = rows[rows.length - 1];
    if (y >= last.getBoundingClientRect().bottom) return { row: last, fraction: 1, below: true };
    return null;
}

function getProjectHead(projectId) {
    return todoList.querySelector(`.project-head[data-project-id="${CSS.escape(projectId)}"]`);
}

// Task ids in a project, top to bottom as the tree shows them (also for a collapsed project).
function getProjectTaskOrder(projectId) {
    return sortProjectTasks(getItemsForTab().filter((item) => item.projectId === projectId)).map((item) => item.id);
}

function findDropTarget(y) {
    const hit = rowAtY(y);
    if (!hit) return null;
    return drag.isProject ? findProjectDropTarget(hit) : findTaskDropTarget(hit);
}

function findTaskDropTarget({ row, fraction }) {
    if (row.dataset.projectId) {
        const order = getProjectTaskOrder(row.dataset.projectId).filter((id) => id !== drag.id);
        return { kind: 'into', projectId: row.dataset.projectId, beforeId: order[0] ?? null, highlight: row };
    }
    const projectId = row.dataset.ownerProjectId;
    if (fraction < 0.5) return { kind: 'line', projectId, beforeId: row.dataset.taskId, lineRow: row, lineAt: 'top' };
    const order = getProjectTaskOrder(projectId).filter((id) => id !== drag.id);
    const next = order[order.indexOf(row.dataset.taskId) + 1] ?? null;
    return { kind: 'line', projectId, beforeId: next, lineRow: row, lineAt: 'bottom' };
}

// Levels the gap under a row can close: its project, then each ancestor whose visible sub-tree ends at the
// same row. Deepest first. Empty when the row isn't the last one of its project's sub-tree.
function getClosingLevels(row, head) {
    const levels = [];
    for (let project = projects.find((item) => item.id === head.dataset.projectId); project;
        project = projects.find((item) => item.id === project.parentId)) {
        const projectHead = getProjectHead(project.id);
        if (!projectHead) break;
        const rows = [projectHead, ...getProjectRows(projectHead)].filter((item) => !drag.rows.has(item));
        if (rows[rows.length - 1] !== row) break;
        levels.push({ project, head: projectHead });
    }
    return levels;
}

function resolveParent(project) {
    return projects.some((item) => item.id === project.parentId) ? project.parentId : null;
}

function findProjectDropTarget({ row, fraction, below }) {
    // Over a task, act as if over its project's head, so hovering a project's tasks nests into it.
    const head = row.dataset.projectId ? row : getProjectHead(row.dataset.ownerProjectId);
    if (!head) return null;
    const target = projects.find((project) => project.id === head.dataset.projectId);
    if (!target || target.id === drag.id || getDescendantIds(projects, drag.id).includes(target.id)) return null;

    if (row === head && fraction < 0.3) {
        return { kind: 'line', parentId: resolveParent(target), beforeId: target.id, lineRow: head, lineAt: 'top', depth: rowDepth(head) };
    }

    // Under the last row of a nested group, the gap is "after" several projects at once. Sliding the pointer
    // left picks a shallower one, out to the top level; below the whole list it is always the top level.
    const levels = fraction > (row === head ? 0.7 : 0.5) ? getClosingLevels(row, head) : [];
    if (levels.length) {
        const wanted = below ? -Infinity : drag.depth + Math.round((drag.pointerX - drag.startX) / 24);
        const level = levels.find((item) => rowDepth(item.head) <= wanted) ?? levels[levels.length - 1];
        const parentId = resolveParent(level.project);
        const siblings = getChildProjects(projects, parentId).map((project) => project.id).filter((id) => id !== drag.id);
        const beforeId = siblings[siblings.indexOf(level.project.id) + 1] ?? null;
        return { kind: 'line', parentId, beforeId, lineRow: row, lineAt: 'bottom', depth: rowDepth(level.head) };
    }
    return { kind: 'into', parentId: target.id, beforeId: null, highlight: head };
}

function showDropTarget(target) {
    todoList.querySelectorAll('.row--drop-into').forEach((row) => row.classList.remove('row--drop-into'));
    drag.indicator.hidden = !target || target.kind !== 'line';
    if (!target) return;
    if (target.kind === 'into') {
        target.highlight.classList.add('row--drop-into');
        return;
    }
    const rect = target.lineRow.getBoundingClientRect();
    const indent = 8 + (target.depth ?? rowDepth(target.lineRow)) * 20;
    drag.indicator.style.top = `${(target.lineAt === 'top' ? rect.top : rect.bottom) - 1}px`;
    drag.indicator.style.left = `${rect.left + indent}px`;
    drag.indicator.style.width = `${Math.max(rect.width - indent - 6, 24)}px`;
}

function endDrag(commit) {
    const { target, ghost, indicator, rows, scrollFrame, isProject, id } = drag;
    cancelAnimationFrame(scrollFrame);
    ghost.remove();
    indicator.remove();
    rows.forEach((row) => row.classList.remove('row--dragging'));
    todoList.querySelectorAll('.row--drop-into').forEach((row) => row.classList.remove('row--drop-into'));
    document.body.classList.remove('is-dragging');
    drag = null;

    // The release would otherwise land as a click on whatever is under it (a checkbox, a project toggle).
    const swallowClick = (event) => {
        event.stopPropagation();
        event.preventDefault();
    };
    window.addEventListener('click', swallowClick, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', swallowClick, { capture: true }), 0);

    if (!commit || !target) return;
    if (isProject) dropProject(id, target);
    else dropTask(id, target);
}

function dropProject(projectId, target) {
    const next = moveProjectTo(projects, projectId, target.parentId, target.beforeId);
    if (next === projects) return;
    projects = next;
    if (target.kind === 'into') setProjectCollapsed(target.parentId, false);
    saveProjects();
    renderTasks();
}

function dropTask(taskId, target) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const order = placeId(getProjectTaskOrder(target.projectId), taskId, target.beforeId);
    const position = new Map(order.map((id, index) => [id, index]));
    task.projectId = target.projectId;
    tasks.forEach((item) => {
        if (position.has(item.id)) item.projectOrder = position.get(item.id);
    });
    if (target.kind === 'into') setProjectCollapsed(target.projectId, false);
    saveTasks();
    renderTasks();
}

function getProjectMenuItems(project, anchor) {
    return [
        { label: 'Add task', icon: 'plus', onSelect: () => openSheet({ projectId: project.id }) },
        { label: 'Add sub-project', icon: 'folder', onSelect: () => createProject(project.id) },
        { label: 'Rename', icon: 'edit', onSelect: () => renameProject(project.id) },
        { label: 'Move under…', icon: 'arrow-right', onSelect: () => openProjectMovePicker(project, anchor) },
        'sep',
        { label: 'Delete', icon: 'trash', danger: true, onSelect: () => deleteProject(project.id) },
    ];
}

// Menu entries for every project except the excluded ones, labeled with their full path.
function getProjectPickerItems(excludedIds, onPick) {
    return flattenProjects(projects)
        .filter(({ project }) => !excludedIds.has(project.id))
        .map(({ project, path }) => ({ label: path.join(' › '), icon: 'folder', onSelect: () => onPick(project.id) }));
}

function openProjectMovePicker(project, anchor) {
    const excluded = new Set([project.id, project.parentId, ...getDescendantIds(projects, project.id)]);
    const items = getProjectPickerItems(excluded, (parentId) => moveProject(project.id, parentId));
    if (project.parentId) items.unshift({ label: 'Top level', icon: 'later', onSelect: () => moveProject(project.id, null) });
    if (!items.length) {
        alert('There is no other project to move this under.');
        return;
    }
    openMenu(anchor, items);
}

function createProject(parentId = null) {
    const name = window.prompt(parentId ? 'Sub-project name' : 'Project name')?.trim();
    if (!name) return;

    projects.push({ id: createTaskId(), name, parentId });
    if (parentId) setProjectCollapsed(parentId, false);
    saveProjects();
    renderTasks();
}

function renameProject(projectId) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    const name = window.prompt('Rename project', project.name)?.trim();
    if (!name || name === project.name) return;

    project.name = name;
    saveProjects();
    renderTasks();
}

function moveProject(projectId, parentId) {
    projects = moveProjectTo(projects, projectId, parentId);
    if (parentId) setProjectCollapsed(parentId, false);
    saveProjects();
    renderTasks();
}

function deleteProject(projectId) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    const parent = projects.find((item) => item.id === project.parentId);
    const outcome = parent
        ? `Its tasks and sub-projects move to "${parent.name}".`
        : 'Its sub-projects move to the top level and its tasks leave the project.';
    if (!window.confirm(`Delete "${project.name}"? ${outcome}`)) return;

    const parentId = parent ? parent.id : null;
    projects = projects
        .filter((item) => item.id !== projectId)
        .map((item) => (item.parentId === projectId ? { ...item, parentId } : item));
    tasks = tasks.map((task) => (task.projectId === projectId ? assignProject(task, parentId) : task));
    setProjectCollapsed(projectId, false);
    saveProjects();
    saveTasks();
    renderTasks();
}

// Returns a copy of the task in the given project (or none), keeping its date-tab choice.
function assignProject(task, projectId) {
    const { projectId: previousId, inDateTabs, ...rest } = task;
    return projectId ? { ...rest, projectId, inDateTabs: Boolean(inDateTabs) } : rest;
}

function moveTaskToProject(taskId, projectId) {
    tasks = tasks.map((task) => (task.id === taskId ? assignProject(task, projectId) : task));
    if (projectId) setProjectCollapsed(projectId, false);
    saveTasks();
    renderTasks();
}

function setTaskInDateTabs(taskId, inDateTabs) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    task.inDateTabs = inDateTabs;
    saveTasks();
    renderTasks();
}

function getTaskProjectMenuItems(task, anchor) {
    if (!projects.length) return [];
    const inProject = getProjectIds().has(task.projectId);
    const items = [];

    if (inProject && hasDate(task)) {
        items.push({
            label: task.inDateTabs ? 'Hide from date tabs' : 'Show in date tabs',
            icon: 'today',
            onSelect: () => setTaskInDateTabs(task.id, !task.inDateTabs),
        });
    }

    items.push({
        label: inProject ? 'Move to project…' : 'Add to project…',
        icon: 'folder',
        onSelect: () => {
            const pickerItems = getProjectPickerItems(new Set([task.projectId]), (projectId) => moveTaskToProject(task.id, projectId));
            if (inProject) pickerItems.unshift({ label: 'No project', icon: 'x', onSelect: () => moveTaskToProject(task.id, null) });
            openMenu(anchor, pickerItems);
        },
    });

    return items;
}

function createTaskRow(task, now) {
    const row = document.createElement('li');
    row.className = `row${task.completed ? ' row--done' : ''}${task.isVirtual ? ' row--virtual' : ''}`;

    row.appendChild(createRowLead(task));

    const body = document.createElement('div');
    body.className = 'row__body';
    body.appendChild(createRowTitle(task));

    const metaParts = [];
    if (task.repeatRule) metaParts.push(`${icon('repeat', 'icon-sm')}<span>${escapeHtml(formatRepeatLabel(task.repeatRule))}</span>`);
    if (task.type === 'event' && task.endTime) metaParts.push(`<span>until ${escapeHtml(task.endTime)}</span>`);
    if (task.alarmTime && !task.completed) metaParts.push(`${icon('alarm', 'icon-sm')}<span>${escapeHtml(formatTime(task.alarmTime))}</span>`);
    if (metaParts.length) {
        const meta = document.createElement('div');
        meta.className = 'row__meta';
        meta.innerHTML = metaParts.join('<span aria-hidden="true">·</span>');
        body.appendChild(meta);
    }
    row.appendChild(body);

    const time = document.createElement('span');
    time.className = 'row__time';
    // An undated project task reads as due today rather than showing a dash.
    const cellTask = activeTab === 'projects' && !hasDate(task) ? { ...task, noDue: false, dueDate: toIsoDate(now), dueTime: '' } : task;
    time.textContent = formatTimeCell(cellTask, now);
    time.title = formatDueLabel(task);
    if (isOverdue(task, now)) {
        time.classList.add('row__time--late');
    } else if (isItemUrgent(task)) {
        time.classList.add('row__time--soon');
    }
    row.appendChild(time);

    row.appendChild(createRowTrail(task));

    if (activeTab === 'repeating' && repeatEditorTaskId === task.id && task.repeatRule?.interval) {
        row.classList.add('has-editor');
        const editorWrap = document.createElement('div');
        editorWrap.className = 'row__editor';
        editorWrap.appendChild(createRepeatEditor(task));
        row.appendChild(editorWrap);
    }

    return row;
}

function createRowLead(task) {
    if (activeTab === 'repeating') {
        const lead = document.createElement('span');
        lead.className = 'row__lead';
        lead.innerHTML = icon('repeat');
        return lead;
    }

    const checkbox = document.createElement('button');
    checkbox.type = 'button';
    checkbox.className = 'chk';
    checkbox.innerHTML = icon('check');
    if (task.isVirtual) {
        checkbox.disabled = true;
        checkbox.setAttribute('aria-label', 'Upcoming occurrence');
    } else {
        checkbox.setAttribute('aria-label', task.completed ? 'Mark not complete' : 'Mark complete');
        checkbox.setAttribute('aria-pressed', String(Boolean(task.completed)));
        checkbox.addEventListener('click', () => toggleTask(task.id));
    }
    return checkbox;
}

function createRowTitle(task) {
    if (editingTaskId === task.id) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'row__title-input';
        input.value = task.text;
        input.setAttribute('aria-label', 'Rename item');
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                commitTaskRename(task.id, input.value);
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                cancelTaskRename();
            }
        });
        input.addEventListener('blur', () => {
            if (editingTaskId === task.id) {
                commitTaskRename(task.id, input.value);
            }
        });
        requestAnimationFrame(() => {
            if (editingTaskId === task.id) {
                input.focus();
                input.select();
            }
        });
        return input;
    }

    const title = document.createElement('p');
    title.className = 'row__title';
    title.textContent = task.text;
    if (task.type === 'event') {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = 'EVENT';
        title.appendChild(tag);
    }
    if (canRenameTask(task)) {
        title.title = 'Double-click to rename';
        title.addEventListener('dblclick', () => beginTaskRename(task.id));
    }
    return title;
}

function createRowTrail(task) {
    if (task.isVirtual) {
        const spacer = document.createElement('span');
        spacer.className = 'row__trail';
        return spacer;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-btn icon-btn--ghost row__trail';

    if (task.completed && activeTab !== 'completed') {
        button.innerHTML = icon('x');
        button.setAttribute('aria-label', 'Remove from list');
        button.addEventListener('click', () => dismissTask(task.id));
        return button;
    }

    button.innerHTML = icon('more');
    button.setAttribute('aria-label', 'More actions');
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => openMenu(button, getRowMenuItems(task, button)));
    return button;
}

function getRowMenuItems(task, anchor) {
    const deleteItem = { label: 'Delete', icon: 'trash', danger: true, onSelect: () => removeTask(task.id) };

    if (activeTab === 'repeating') {
        const isOpen = repeatEditorTaskId === task.id;
        return [
            {
                label: isOpen ? 'Close repeat editor' : 'Edit repeat rule',
                icon: 'edit',
                onSelect: () => {
                    repeatEditorTaskId = isOpen ? null : task.id;
                    renderTasks();
                },
            },
            'sep',
            deleteItem,
        ];
    }

    if (activeTab === 'completed') {
        return [{ label: 'Mark active', icon: 'undo', onSelect: () => toggleTask(task.id) }, 'sep', deleteItem];
    }

    const projectItems = getTaskProjectMenuItems(task, anchor);
    const tail = projectItems.length ? [...projectItems, 'sep', deleteItem] : [deleteItem];
    const alarmItems = getAlarmMenuItems(task);

    if (activeTab === 'projects') {
        return alarmItems.length ? [...alarmItems, 'sep', ...tail] : tail;
    }

    if (task.noDue) {
        const setSection = (section) => () => {
            task.section = section;
            saveTasks();
            renderTasks();
        };
        return [
            { label: 'Show in Today', icon: 'today', onSelect: setSection('today') },
            { label: 'Show in Later', icon: 'later', onSelect: setSection('later') },
            'sep',
            ...tail,
        ];
    }

    return [
        { label: 'Later today', icon: 'clock', hint: '+2h', onSelect: () => postponeTask(task.id, 1 / 12) },
        { label: 'Tomorrow', icon: 'calendar', hint: '+1d', onSelect: () => postponeTask(task.id, 1) },
        { label: 'In 2 days', icon: 'arrow-right', hint: '+2d', onSelect: () => postponeTask(task.id, 2) },
        { label: 'In 3 days', icon: 'arrow-skip', hint: '+3d', onSelect: () => postponeTask(task.id, 3) },
        ...(alarmItems.length ? ['sep', ...alarmItems] : []),
        'sep',
        ...tail,
    ];
}

// Set / change / remove an item's alarm from the row menu. Only dated, non-virtual items can ring.
// The web app stores and displays the time; the Android app is what actually rings it.
function getAlarmMenuItems(task) {
    if (task.isVirtual || !hasDate(task)) return [];
    const has = Boolean(task.alarmTime);
    const items = [{
        label: has ? `Change alarm · ${formatTime(task.alarmTime)}` : 'Set alarm',
        icon: 'alarm',
        onSelect: () => editAlarm(task),
    }];
    if (has) {
        items.push({ label: 'Remove alarm', icon: 'x', onSelect: () => setAlarm(task, null) });
    }
    return items;
}

function setAlarm(task, value) {
    if (value) task.alarmTime = value;
    else delete task.alarmTime;
    saveTasks();
    renderTasks();
}

function editAlarm(task) {
    const base = task.alarmTime || itemTime(task) || '09:00';
    const input = window.prompt('Alarm time (24-hour HH:MM)', base);
    if (input === null) return;
    const trimmed = input.trim();
    if (!trimmed) {
        setAlarm(task, null);
        return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
        window.alert('Enter the time as HH:MM in 24-hour format, e.g. 09:00 or 18:30.');
        return;
    }
    setAlarm(task, trimmed);
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

let openMenuState = null;

function openMenu(anchor, items) {
    const reopeningSame = openMenuState?.anchor === anchor;
    closeMenu({ restoreFocus: false });
    if (reopeningSame) return;

    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.setAttribute('role', 'menu');

    items.forEach((item) => {
        if (item === 'sep') {
            const sep = document.createElement('div');
            sep.className = 'menu__sep';
            sep.setAttribute('role', 'separator');
            menu.appendChild(sep);
            return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = `menu__item${item.danger ? ' menu__item--danger' : ''}`;
        button.setAttribute('role', 'menuitem');
        button.innerHTML = `${icon(item.icon)}<span>${escapeHtml(item.label)}</span>${item.hint ? `<span class="menu__hint">${escapeHtml(item.hint)}</span>` : ''}`;
        button.addEventListener('click', () => {
            closeMenu();
            item.onSelect();
        });
        menu.appendChild(button);
    });

    document.body.appendChild(menu);

    const rect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - menuRect.width, window.innerWidth - menuRect.width - 8));
    const below = rect.bottom + 4;
    const top = below + menuRect.height > window.innerHeight - 8 ? Math.max(8, rect.top - menuRect.height - 4) : below;
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    anchor.setAttribute('aria-expanded', 'true');
    openMenuState = { menu, anchor };
    menu.querySelector('.menu__item')?.focus();
}

function closeMenu({ restoreFocus = true } = {}) {
    if (!openMenuState) return;
    const { menu, anchor } = openMenuState;
    openMenuState = null;
    menu.remove();
    anchor.setAttribute('aria-expanded', 'false');
    if (restoreFocus && anchor.isConnected) anchor.focus();
}

document.addEventListener('pointerdown', (event) => {
    if (!openMenuState) return;
    if (openMenuState.menu.contains(event.target) || openMenuState.anchor.contains(event.target)) return;
    closeMenu({ restoreFocus: false });
});

document.addEventListener('keydown', (event) => {
    if (!openMenuState) return;
    const items = Array.from(openMenuState.menu.querySelectorAll('.menu__item'));
    const index = items.indexOf(document.activeElement);

    if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        items[(index + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Tab') {
        closeMenu({ restoreFocus: false });
    }
});

window.addEventListener('resize', () => closeMenu({ restoreFocus: false }));
window.addEventListener('scroll', (event) => {
    // A long project picker scrolls inside the menu; only page scrolls should close it.
    if (openMenuState?.menu.contains(event.target)) return;
    closeMenu({ restoreFocus: false });
}, true);

function addTask(text) {
    const itemType = itemTypeSelect.value;
    const noDue = noDueCheckbox.checked;
    const repeat = repeatTaskCheckbox.checked;

    const repeatRule = repeat
        ? {
            interval: Math.max(1, Number(repeatIntervalInput.value) || 1),
            unit: repeatUnitSelect.value,
            stopDate: repeatEndInput.value || '',
            revealTime: itemType === 'task' ? revealTimeInput.value || '' : '',
            daysOfWeek: Array.from(repeatWeekdayField.querySelectorAll('.weekday-pill.selected')).map((button) => Number(button.dataset.day)),
            daysOfMonth: parseMonthDays(repeatMonthdaysInput.value),
            monthPattern: repeatMonthPatternSelect.value,
            monthWeeks: getSelectedValues(repeatMonthWeekField, 'data-week'),
            monthWeekdays: getSelectedValues(repeatMonthWeekdayField, 'data-day'),
        }
        : null;

    const item = {
        type: itemType,
        text,
        completed: false,
        repeatRule,
    };

    if (itemType === 'event') {
        // Get the start date for the event from the input field, or use the next applicable date based on the repeat rule if no start date is provided.
        // MAKE SURE that if the start date does not match the repeat rule, it should be adjusted to the next valid date according to the repeat rule.
        let startDate = startDateInput.value || getTodayIso();
        startDate = normalizeDate(startDate); // Ensure the start date is in the correct format.
        startDate = repeatRule ? getNextValidStartDate(startDate, repeatRule, item) : startDate; // Adjust to the next valid date if necessary.
        startDateInput.value = startDate; // Update the input field to reflect the actual start date being used.

        item.startDate = startDate;
        item.startTime = startTimeInput.value;
        item.endTime = endTimeInput.value;

        if (!item.startTime || !item.endTime) {
            alert('Events require both start and end times.');
            return null;
        }
    } else {
        // do the same thing here
        let startDate = noDue ? getTodayIso() : dueDateInput.value || getTodayIso();
        startDate = normalizeDate(startDate); // Ensure the start date is in the correct format.
        startDate = repeatRule ? getNextValidStartDate(startDate, repeatRule, item) : startDate; // Adjust to the next valid date if necessary.
        dueDateInput.value = startDate; // Update the input field to reflect the actual start date being used.

        item.noDue = noDue;
        item.section = noDue ? taskSectionSelect.value : 'today';
        item.dueDate = noDue ? getTodayIso() : normalizeDate(dueDateInput.value || getTodayIso());
        item.dueTime = noDue ? '' : dueTimeInput.value;
    }

    if (projectSelect.value) {
        item.projectId = projectSelect.value;
        item.inDateTabs = inDateTabsCheckbox.checked;
    }

    // Dated items can carry an alarm time. The web app only stores and shows it; the Android app rings it.
    const dated = itemType === 'event' || !noDue;
    if (dated && alarmTaskCheckbox.checked && alarmTimeInput.value) {
        item.alarmTime = alarmTimeInput.value;
    }

    pushTask(item);
    renderTasks();
    return item;
}

function removeTask(taskId) {
    const confirmed = window.confirm('Delete this item? This cannot be undone.');
    if (!confirmed) return;

    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();
    renderTasks();
}

function dismissTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    task.dismissed = true;
    saveTasks();
    renderTasks();
}

function postponeTask(taskId, days) {
    tasks = tasks.map((task) => {if (task.id !== taskId) return task;
        if (task.noDue) return task;

        if (days < 1) {
            const now = Date.now();
            const minShowTime = now + days * 24 * 60 * 60 * 1000;
            
            return {
                ...task,
                minShowTime: minShowTime,
            };
        }

        if (task.type === 'event') {
            return {
                ...task,
                startDate: addInterval(task.startDate, days, 'day'),
            };
        }

        return {
            ...task,
            dueDate: addInterval(task.dueDate, days, 'day'),
        };
    });

    console.log(tasks)

    saveTasks();
    renderTasks();
}

// Snapshot of the fields a repeat completion changes, so an accidental tick can be undone the same day.
function definedFields(fields) {
    return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

function undoRepeatCompletion(occurrence) {
    const { templateId, ...fields } = occurrence.undo;

    if (templateId === occurrence.id) {
        // Last occurrence: the item itself was completed and lost its rule.
        const { completedOn, dismissed, undo, ...rest } = occurrence;
        tasks = tasks.map((item) => (item.id === occurrence.id ? { ...rest, ...fields, completed: false } : item));
        return true;
    }

    if (!tasks.some((item) => item.id === templateId)) return false;
    tasks = tasks
        .filter((item) => item.id !== occurrence.id)
        .map((item) => (item.id === templateId ? { ...item, ...fields } : item));
    return true;
}

function toggleTask(taskId) {
    const target = tasks.find((item) => item.id === taskId);
    if (target?.completed && target.undo && target.completedOn === getTodayIso() && undoRepeatCompletion(target)) {
        saveTasks();
        renderTasks();
        return;
    }

    const newTasks = [];

    tasks.forEach((task) => {
        if (task.id !== taskId) {
            newTasks.push(task);
            return;
        }

        if (task.repeatRule && !task.isVirtual && !task.completed) {
            const currentIso = task.type === 'event' ? task.startDate : task.dueDate;
            const completedOccurrence = {
                id: createTaskId(),
                type: task.type,
                text: task.text,
                completed: true,
                completedOn: getTodayIso(),
                dismissed: false,
                repeatRule: null,
                isVirtual: false,
                ...definedFields({ projectId: task.projectId, inDateTabs: task.inDateTabs }),
            };

            if (task.type === 'event') {
                completedOccurrence.startDate = currentIso;
                completedOccurrence.startTime = task.startTime;
                completedOccurrence.endTime = task.endTime;
                completedOccurrence.undo = definedFields({ templateId: task.id, startDate: task.startDate, startTime: task.startTime, endTime: task.endTime });
            } else {
                completedOccurrence.dueDate = currentIso;
                completedOccurrence.dueTime = task.dueTime;
                completedOccurrence.noDue = task.noDue;
                completedOccurrence.section = task.section;
                completedOccurrence.undo = definedFields({ templateId: task.id, dueDate: task.dueDate, dueTime: task.dueTime });
            }

            const nextOccurrence = getNextRepeatOccurrence(task);
            if (nextOccurrence) {
                let updatedTask;
                if (task.type === 'event') {
                    updatedTask = {
                        ...task,
                        startDate: nextOccurrence.startDate || task.startDate,
                        startTime: nextOccurrence.startTime ?? task.startTime,
                        endTime: nextOccurrence.endTime ?? task.endTime,
                    };
                } else {
                    updatedTask = {
                        ...task,
                        dueDate: nextOccurrence.dueDate || task.dueDate,
                        dueTime: nextOccurrence.dueTime ?? task.dueTime,
                    };
                }
                newTasks.push(updatedTask);
                newTasks.push(completedOccurrence);
            } else {
                newTasks.push({ ...task, completed: true, completedOn: getTodayIso(), dismissed: false, repeatRule: null, undo: { templateId: task.id, repeatRule: task.repeatRule } });
            }

            return;
        }

        if (task.completed) {
            const { completedOn, dismissed, undo, ...rest } = task;
            newTasks.push({ ...rest, completed: false });
        } else {
            newTasks.push({ ...task, completed: true, completedOn: getTodayIso(), dismissed: false });
        }
    });

    tasks = newTasks;
    saveTasks();
    renderTasks();
}

function getNextRepeatOccurrence(task) {
    if (!task.repeatRule) return null;

    const rule = task.repeatRule;
    const anchorIso = task.type === 'event' ? task.startDate : task.dueDate;
    const anchorDate = new Date(`${anchorIso}T00:00:00`);
    const candidate = new Date(anchorDate);

    while (true) {
        candidate.setDate(candidate.getDate() + 1);
        const iso = candidate.toISOString().slice(0, 10);
        if (rule.stopDate && iso > rule.stopDate) return null;
        if (matchesRepeatRule(task, iso, rule, anchorIso)) {
            if (task.type === 'event') {
                return {
                    id: createTaskId(),
                    type: 'event',
                    text: task.text,
                    startDate: iso,
                    startTime: task.startTime,
                    endTime: task.endTime,
                    completed: false,
                    repeatRule: { ...rule },
                };
            }

            return {
                id: createTaskId(),
                type: 'task',
                text: task.text,
                dueDate: iso,
                dueTime: task.dueTime || '',
                noDue: false,
                section: 'today',
                completed: false,
                repeatRule: { ...rule },
            };
        }
    }
}

function setActiveTab(tabName) {
    activeTab = tabName;
    tabButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
    newProjectButton.classList.toggle('hidden', tabName !== 'projects');
    repeatEditorTaskId = null;
    searchQuery = '';
    searchInput.value = '';
    renderTasks();
}

function updateNoDueState() {
    const disabled = noDueCheckbox.checked;
    dueDateInput.disabled = disabled;
    dueTimeInput.disabled = disabled;
    // An undated project task lives only in its project, so Today/Later does not apply.
    taskSectionField.classList.toggle('hidden', !disabled || Boolean(projectSelect.value));
    if (disabled) {
        dueDateInput.value = getTodayIso();
        dueTimeInput.value = '';
    }
    updateAlarmVisibility();
}

// The alarm only makes sense when the item has a day to ring on (a dated task or any event).
function updateAlarmVisibility() {
    const dated = itemTypeSelect.value === 'event' || !noDueCheckbox.checked;
    alarmRow.classList.toggle('hidden', !dated);
    const on = dated && alarmTaskCheckbox.checked;
    alarmControls.classList.toggle('hidden', !on);
    if (on && !alarmTimeInput.value) alarmTimeInput.value = '09:00';
}

function updateRepeatVisibility() {
    const enabled = repeatTaskCheckbox.checked;
    repeatControls.classList.toggle('hidden', !enabled);
    updateRepeatFieldVisibility();
}

function updateRepeatFieldVisibility() {
    const unit = repeatUnitSelect.value;
    repeatWeekdayField.classList.toggle('hidden', unit !== 'week');
    repeatMonthdayField.classList.toggle('hidden', unit !== 'month');
    const isWeekdayPattern = unit === 'month' && repeatMonthPatternSelect.value === 'weekday';
    repeatMonthDaysField.classList.toggle('hidden', unit !== 'month' || isWeekdayPattern);
    repeatMonthWeekField.classList.toggle('hidden', !isWeekdayPattern);
    repeatMonthWeekdayField.classList.toggle('hidden', !isWeekdayPattern);
}

function expireStoppedRepeats() {
    const today = getTodayIso();
    let changed = false;
    tasks.forEach((task) => {
        if (task.repeatRule?.stopDate && task.repeatRule.stopDate < today) {
            task.repeatRule = null;
            changed = true;
        }
    });
    if (changed) saveTasks();
}

function isItemUrgent(item) {
    if (item.completed || item.isVirtual) return false;

    const dateIso = item.type === 'event' ? item.startDate : item.dueDate;
    const timeValue = item.type === 'event' ? item.startTime : item.dueTime;
    if (!dateIso || !timeValue) return false;

    const now = new Date();
    const target = new Date(`${dateIso}T${timeValue}`);
    const diffMs = target - now;
    return diffMs >= 0 && diffMs <= 4 * 60 * 60 * 1000;
}

function updateFormMode() {
    const isEvent = itemTypeSelect.value === 'event';
    taskFields.forEach((element) => {
        element.classList.toggle('hidden', isEvent);
    });
    eventFields.forEach((element) => {
        element.classList.toggle('hidden', !isEvent);
    });
    taskSectionRow.classList.toggle('hidden', isEvent);
    revealTimeRow.classList.toggle('hidden', isEvent);
    typeTaskButton.setAttribute('aria-pressed', String(!isEvent));
    typeEventButton.setAttribute('aria-pressed', String(isEvent));
    updateProjectFields();
    updateAlarmVisibility();
}

function updateProjectFields() {
    projectRow.classList.toggle('hidden', projects.length === 0);
    const dated = itemTypeSelect.value === 'event' || !noDueCheckbox.checked;
    dateTabsSwitch.classList.toggle('hidden', !projectSelect.value || !dated);
}

function populateProjectSelect(selectedId) {
    projectSelect.replaceChildren(new Option('No project', ''));
    flattenProjects(projects).forEach(({ project, path }) => projectSelect.add(new Option(path.join(' › '), project.id)));
    projectSelect.value = projects.some((project) => project.id === selectedId) ? selectedId : '';
}

[typeTaskButton, typeEventButton].forEach((button) => {
    button.addEventListener('click', () => {
        itemTypeSelect.value = button === typeEventButton ? 'event' : 'task';
        itemTypeSelect.dispatchEvent(new Event('change'));
    });
});

tabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

noDueCheckbox.addEventListener('change', () => {
    updateNoDueState();
    updateFormMode();
});

repeatTaskCheckbox.addEventListener('change', updateRepeatVisibility);
alarmTaskCheckbox.addEventListener('change', updateAlarmVisibility);
repeatUnitSelect.addEventListener('change', updateRepeatFieldVisibility);
repeatMonthPatternSelect.addEventListener('change', updateRepeatFieldVisibility);
itemTypeSelect.addEventListener('change', () => {
    updateFormMode();
});

projectSelect.addEventListener('change', () => {
    updateNoDueState();
    updateFormMode();
});

startTimeInput.addEventListener('change', () => {
    if (!startTimeInput.value || endTimeInput.value) return;

    const [hours, minutes] = startTimeInput.value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;

    const date = new Date(1970, 0, 1, hours, minutes);
    date.setHours(date.getHours() + 1);
    const paddedHours = String(date.getHours()).padStart(2, '0');
    const paddedMinutes = String(date.getMinutes()).padStart(2, '0');
    endTimeInput.value = `${paddedHours}:${paddedMinutes}`;
});

repeatWeekdayField.addEventListener('click', (event) => {
    const button = event.target.closest('.weekday-pill');
    if (!button) return;
    button.classList.toggle('selected');
});

[repeatMonthWeekField, repeatMonthWeekdayField].forEach((field) => {
    field.addEventListener('click', (event) => {
        const button = event.target.closest('.weekday-pill');
        if (!button) return;
        button.classList.toggle('selected');
    });
});

function toggleSearch(show = searchToolbar.classList.contains('hidden')) {
    searchToolbar.classList.toggle('hidden', !show);
    searchButton.setAttribute('aria-expanded', String(show));
    if (show) {
        searchInput.focus();
    } else if (searchQuery) {
        searchQuery = '';
        searchInput.value = '';
        renderTasks();
    }
}

searchButton.addEventListener('click', () => toggleSearch());

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        event.preventDefault();
        toggleSearch(false);
        searchButton.focus();
    }
});

searchInput.addEventListener('input', (event) => {
    searchQuery = event.target.value;
    renderTasks();
});

async function exportTasks() {
    try {
        await navigator.clipboard.writeText(JSON.stringify({ tasks, projects }, null, 2));
        alert('Tasks copied to clipboard');
    } catch (error) {
        alert('Unable to copy to clipboard. Please allow clipboard access or copy manually.');
    }
}

async function importTasks() {
    try {
        const clipboardText = await navigator.clipboard.readText();
        const imported = JSON.parse(clipboardText);
        // Older exports are a bare task array; newer ones are { tasks, projects }.
        const importedTasks = Array.isArray(imported) ? imported : imported?.tasks;
        if (!Array.isArray(importedTasks)) throw new Error('Invalid JSON');
        tasks = fromStored(migrateCollection(importedTasks, createTaskId));
        if (Array.isArray(imported?.projects)) {
            projects = normalizeProjects(fromStored(migrateCollection(imported.projects, createTaskId)));
            saveProjects();
        }
        saveTasks();
        renderTasks();
        alert('Tasks imported from clipboard');
    } catch (error) {
        alert('Failed to import JSON. Make sure valid task JSON is on your clipboard.');
    }
}

todoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = todoInput.value.trim();
    if (!value) return;

    const item = addTask(value);
    if (!item) return;

    todoInput.value = '';
    dueDateInput.value = getTodayIso();
    dueTimeInput.value = '';
    startDateInput.value = getTodayIso();
    startTimeInput.value = '';
    endTimeInput.value = '';
    repeatTaskCheckbox.checked = false;
    repeatIntervalInput.value = 1;
    repeatUnitSelect.value = 'day';
    repeatEndInput.value = '';
    revealTimeInput.value = '';
    repeatMonthdaysInput.value = '';
    repeatMonthPatternSelect.value = 'days';
    repeatMonthWeekButtons.forEach((button) => button.classList.toggle('selected', button.dataset.week === '1'));
    repeatMonthWeekdayButtons.forEach((button) => button.classList.toggle('selected', button.dataset.day === '0'));
    taskSectionSelect.value = 'today';
    noDueCheckbox.checked = false;
    alarmTaskCheckbox.checked = false;
    alarmTimeInput.value = '';
    projectSelect.value = '';
    inDateTabsCheckbox.checked = false;
    updateNoDueState();
    updateRepeatVisibility();
    updateFormMode();
    closeSheet();
});

// A project's "Add task" preselects it and starts undated, since project tasks usually have no date.
// Where focus goes back to when the sheet closes; a project's menu button when opened from there.
let sheetOpener = null;

function openSheet({ projectId } = {}) {
    if (addSheet.open) return;
    sheetOpener = openMenuState?.anchor || document.activeElement;
    closeMenu({ restoreFocus: false });
    populateProjectSelect(projectId || projectSelect.value);
    if (projectId) {
        noDueCheckbox.checked = true;
        setProjectCollapsed(projectId, false);
    }
    updateNoDueState();
    updateFormMode();
    addSheet.showModal();
    todoInput.focus();
}

function closeSheet() {
    if (addSheet.open) addSheet.close();
}

newItemButton.addEventListener('click', () => openSheet());
newProjectButton.addEventListener('click', () => createProject());
sheetCancelButton.addEventListener('click', closeSheet);

// A click that lands on the dialog element itself is a click on the backdrop.
addSheet.addEventListener('click', (event) => {
    if (event.target === addSheet) closeSheet();
});

// preventScroll keeps the list where it was; the New item button sits below a long list.
addSheet.addEventListener('close', () => {
    const target = sheetOpener?.isConnected && sheetOpener !== document.body ? sheetOpener : newItemButton;
    sheetOpener = null;
    target.focus({ preventScroll: true });
});

document.addEventListener('keydown', (event) => {
    if (appShell.classList.contains('hidden') || addSheet.open || openMenuState) return;
    if (!shouldOpenSheetOnKey(event)) return;
    event.preventDefault();
    openSheet();
});

// Helper wrapper to handle popup data exactly like a redirect return
const signInPopup = async (provider) => {
    try {
        const result = await signInWithPopup(auth, provider);
        user = result.user;
        // Call whatever state updates or routing you normally do here
    } catch (error) {
        console.error("Popup failed:", error);
    }
};

if (document.getElementById('sign-in-button')) {
    document.getElementById('sign-in-button').addEventListener('click', async () => {
        try {
            const provider = new GoogleAuthProvider();
                
            // Check if you are currently running on localhost
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            console.log('Is localhost:', isLocalhost);
            await signInPopup(provider); 

            // if (isLocalhost) {
            //     // Uses a popup window locally to bypass third-party cookie blocks
                
            // } else {
            //     // Uses the redirect flow on your live Netlify site
            //     await signInWithRedirect(auth, provider);
            // }
            if (user) {
                signInShell.classList.add('hidden');
                appShell.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error signing in with Google:', error);
        }
    });
}

async function signOutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        return;
    }
    stopSync();
    closeSheet();
    toggleSearch(false);
    tasks = [];
    projects = [];
    editingTaskId = null;
    setActiveTab('today');
    appShell.classList.add('hidden');
    signInShell.classList.remove('hidden');
}

accountButton.addEventListener('click', () => openMenu(accountButton, [
    { label: 'Export JSON', icon: 'download', onSelect: exportTasks },
    { label: 'Import JSON', icon: 'upload', onSelect: importTasks },
    { label: 'Export archive', icon: 'download', onSelect: exportArchive },
    'sep',
    { label: 'Sign out', icon: 'sign-out', onSelect: signOutUser },
]));

// Re-render when the page comes back into view and once a minute, so the date line, overdue colors and
// yesterday's struck-through items stay current. Skipped while the user is mid-interaction.
function isInteracting() {
    return Boolean(openMenuState || editingTaskId || repeatEditorTaskId || projectToggleBusy || drag || pendingDrag);
}

function refreshIfIdle() {
    if (appShell.classList.contains('hidden') || addSheet.open || isInteracting()) return;
    renderTasks();
}

// Changes from the database re-render straight away unless a menu, rename or editor is open; then they wait
// for it to close rather than yanking it away.
let remoteRenderTimer = null;

function renderWhenIdle() {
    clearTimeout(remoteRenderTimer);
    if (appShell.classList.contains('hidden')) return;
    if (isInteracting()) {
        remoteRenderTimer = setTimeout(renderWhenIdle, 400);
        return;
    }
    renderTasks();
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshIfIdle();
});
setInterval(refreshIfIdle, 60 * 1000);

const THEME_KEY = 'todo-theme';

function applyTheme(theme, { persist = true } = {}) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0E0E10' : '#FFFFFF');
    if (persist) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            // Storage can be unavailable (private mode); the theme still applies for this visit.
        }
    }
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    });
}

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
        applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
});

// Only an explicit toggle is saved, so first-time visitors keep following the system setting.
applyTheme(resolveTheme(document.documentElement.dataset.theme, false), { persist: false });

async function initialize() {
    dueDateInput.value = getTodayIso();
    startDateInput.value = getTodayIso();
    itemTypeSelect.value = 'task';
    updateFormMode();
    updateNoDueState();
    updateRepeatVisibility();
    setActiveTab(activeTab);
}

