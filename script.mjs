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
const repeatTimeInput = document.getElementById('repeat-time');
const repeatControls = document.getElementById('repeat-controls');
const repeatWeekdayField = document.getElementById('repeat-weekday-field');
const repeatMonthdayField = document.getElementById('repeat-monthday-field');
const repeatMonthdaysInput = document.getElementById('repeat-monthdays');
const advancedOptions = document.getElementById('advanced-options');
const taskSectionRow = document.getElementById('task-section-row');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const searchToolbar = document.getElementById('search-toolbar');
const searchInput = document.getElementById('search-input');
const exportJsonButton = document.getElementById('export-json');
const importJsonButton = document.getElementById('import-json');
const tabButtons = document.querySelectorAll('.tab');
const taskFields = document.querySelectorAll('.item-task');
const eventFields = document.querySelectorAll('.item-event');
const repeatTimeRow = document.getElementById('repeat-time-row');
const submitRow = document.querySelector('.submit-row');
let searchQuery = '';

const STORAGE_KEY = 'todoapp-js-tasks';
let activeTab = 'today';
let tasks = loadTasks();

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';

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

let firebaseDb = null;
let currentUser = null;

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
    case 'week':
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

function formatTime(timeValue) {
  if (!timeValue) return '';
  const date = new Date(`1970-01-01T${timeValue}`);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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
  if (rule.repeatTime) {
    labels.push(`at ${formatTime(rule.repeatTime)}`);
  }
  if (rule.unit === 'week' && rule.daysOfWeek?.length) {
    const names = rule.daysOfWeek.map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]);
    labels.push(`on ${names.join(', ')}`);
  }
  if (rule.unit === 'month' && rule.daysOfMonth?.length) {
    labels.push(`on ${rule.daysOfMonth.join(', ')}`);
  }
  return labels.join(' ');
}

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  syncTasksToFirebase();
}

function loadTasks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveLocalTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

async function syncTasksToFirebase() {
  if (!firebaseDb || !currentUser) return;
  try {
    await set(ref(firebaseDb, `users/${currentUser.uid}/tasks`), tasks);
  } catch (error) {
    console.warn('Firebase save failed', error);
  }
}

async function loadRemoteTasks() {
  if (!firebaseDb || !currentUser) return;
  try {
    const dbRef = ref(firebaseDb);
    const snapshot = await get(child(dbRef, `users/${currentUser.uid}/tasks`));

    if (snapshot.exists()) {
      const data = snapshot.val();
      if (Array.isArray(data)) {
        tasks = data;
        console.log('Loaded tasks from Firebase:', tasks);
        saveLocalTasks();
        renderTasks();
      }
    } else {
      console.log('No data available at this location.');
    }

    console.log('Firebase load completed');
  } catch (error) {
    console.warn('Firebase load failed', error);
  }
}

async function initializeFirebase() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  try {
    const credential = await signInAnonymously(auth);
    currentUser = credential.user;
    firebaseDb = getDatabase(app);
    console.log('Successfully signed in anonymously!', currentUser.uid);
    await loadRemoteTasks();
  } catch (error) {
    console.error('Error signing in:', error.code, error.message);
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
    }
  });
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
      if (!rule.daysOfMonth?.length) return false;
      const day = date.getDate();
      if (!rule.daysOfMonth.includes(day)) return false;
      return monthsBetween(anchorIso, dateIso) % rule.interval === 0;
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
  const editor = document.createElement('details');
  editor.className = 'repeat-editor';

  const summary = document.createElement('summary');
  summary.textContent = 'Edit repeat rule';
  editor.appendChild(summary);

  const content = document.createElement('div');
  content.className = 'repeat-editor-content';

  const intervalField = document.createElement('div');
  intervalField.className = 'field';
  intervalField.innerHTML = `
    <label>Repeat every</label>
    <div class="repeat-repeat-row">
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
    <label>Repeat time <span>(optional)</span></label>
    <input type="time" class="edit-repeat-time" value="${task.repeatRule.repeatTime || ''}" />
  `;

  const weekdayField = document.createElement('div');
  weekdayField.className = 'field edit-weekday-field hidden';
  const selectedWeekdays = task.repeatRule.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6];
  weekdayField.innerHTML = `
    <label>Repeat on</label>
    <div class="weekday-grid weekday-pill-grid">
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
  saveButton.className = 'action-button';
  saveButton.textContent = 'Save repeat rule';
  saveButton.addEventListener('click', () => {
    const intervalValue = Number(intervalField.querySelector('.edit-repeat-interval').value) || 1;
    const unitValue = editUnitSelect.value;
    const stopValue = stopField.querySelector('.edit-repeat-stop').value;
    const repeatTimeValue = timeField.querySelector('.edit-repeat-time').value;
      const weekDays = Array.from(weekdayField.querySelectorAll('.weekday-pill.selected')).map((button) => Number(button.dataset.day));
    saveTasks();
    renderTasks();
    editor.open = false;
  });

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'action-button danger';
  removeButton.textContent = 'Remove repeat rule';
  removeButton.addEventListener('click', () => {
    task.repeatRule = null;
    saveTasks();
    renderTasks();
  });

  footer.append(saveButton, removeButton);
  content.append(intervalField, stopField, timeField, weekdayField, monthdayField, footer);
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
    dueTime: task.dueTime || task.repeatRule?.repeatTime || '',
    isVirtual: true,
  };
}

function getRepeatOccurrences(task, startIso, endIso) {
  if (!task.repeatRule || task.completed) return [];

  const rule = task.repeatRule;
  const anchorIso = task.type === 'event' ? task.startDate : task.dueDate;
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

function getItemsForTab() {
  let items;

  if (activeTab === 'repeating') {
    items = tasks.filter((item) => item.repeatRule && !item.isVirtual);
  } else {
    const baseItems = tasks.filter((item) => getCategory(item) === activeTab);

    if (activeTab === 'tomorrow' || activeTab === 'next3') {
      const today = getTodayIso();
      const tomorrow = addInterval(today, 1, 'day');
      const rangeEnd = activeTab === 'tomorrow' ? tomorrow : addInterval(today, 3, 'day');
      const virtuals = tasks.flatMap((item) => getRepeatOccurrences(item, tomorrow, rangeEnd));
      items = [...baseItems, ...virtuals];
    } else {
      items = baseItems;
    }
  }

  if (!searchQuery.trim()) {
    return items;
  }

  const query = searchQuery.trim().toLowerCase();
  return items.filter((item) => item.text.toLowerCase().includes(query));
}

function renderTasks() {
  todoList.innerHTML = '';
  
  const visibleTasks = getItemsForTab();

  if (visibleTasks.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  visibleTasks.forEach((task) => {
    const listItem = document.createElement('li');
    listItem.className = `todo-item${task.completed ? ' completed' : ''}${task.isVirtual ? ' virtual' : ''}${isItemUrgent(task) ? ' urgent' : ''}`;

    const meta = document.createElement('div');
    const taskTitle = document.createElement('p');
    taskTitle.className = `task-title${task.completed ? ' completed' : ''}`;
    taskTitle.textContent = task.text;
    meta.appendChild(taskTitle);

    const taskMeta = document.createElement('div');
    taskMeta.className = 'todo-meta';

    const dueBadge = document.createElement('span');
    dueBadge.className = 'badge due';
    dueBadge.textContent = formatDueLabel(task);
    taskMeta.appendChild(dueBadge);

    if (task.repeatRule) {
      const repeatBadge = document.createElement('span');
      repeatBadge.className = 'badge repeat';
      repeatBadge.textContent = formatRepeatLabel(task.repeatRule);
      taskMeta.appendChild(repeatBadge);
    }

    if (task.completed) {
      const completeBadge = document.createElement('span');
      completeBadge.className = 'badge completed';
      completeBadge.textContent = 'Completed';
      taskMeta.appendChild(completeBadge);
    }

    if (task.isVirtual) {
      const upcomingBadge = document.createElement('span');
      upcomingBadge.className = 'badge completed';
      upcomingBadge.textContent = 'Upcoming';
      taskMeta.appendChild(upcomingBadge);
    }

    meta.appendChild(taskMeta);

    if (task.noDue && !task.isVirtual) {
      const sectionField = document.createElement('div');
      sectionField.className = 'field no-due-switch';
      sectionField.innerHTML = `
        <label>Show in</label>
        <select class="no-due-section-select">
          <option value="today" ${task.section === 'today' ? 'selected' : ''}>Today</option>
          <option value="later" ${task.section === 'later' ? 'selected' : ''}>Later</option>
        </select>
      `;
      const sectionSelect = sectionField.querySelector('.no-due-section-select');
      sectionSelect.addEventListener('change', (event) => {
        task.section = event.target.value;
        saveTasks();
        renderTasks();
      });
      meta.appendChild(sectionField);
    }

    if (activeTab === 'repeating' && task.repeatRule && !task.isVirtual) {
      meta.appendChild(createRepeatEditor(task));
    }

    if (!task.isVirtual) {
      const actions = document.createElement('div');
      actions.className = 'todo-actions';

      if (activeTab === 'repeating') {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'action-button danger';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => removeTask(task.id));
        actions.append(deleteButton);
      } else {
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'action-button';
        toggleButton.textContent = task.completed ? 'Mark active' : 'Mark complete';
        toggleButton.addEventListener('click', () => toggleTask(task.id));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'action-button danger';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => removeTask(task.id));

        actions.append(toggleButton, deleteButton);

        if (!task.noDue) {
          const postponeActions = document.createElement('div');
          postponeActions.className = 'quick-actions';

          [{ label: '+1d', days: 1 }, { label: '+2d', days: 2 }, { label: '+3d', days: 3 }, { label: '+1w', days: 7 }].forEach((option) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quick-button';
            button.textContent = option.label;
            button.addEventListener('click', () => postponeTask(task.id, option.days));
            postponeActions.appendChild(button);
          });

          actions.append(postponeActions);
        }
      }

      listItem.append(meta, actions);
    } else {
      listItem.append(meta);
    }

    todoList.appendChild(listItem);
  });
}

function addTask(text) {
  const itemType = itemTypeSelect.value;
  const noDue = noDueCheckbox.checked;
  const repeat = repeatTaskCheckbox.checked;

  const repeatRule = repeat
    ? {
        interval: Math.max(1, Number(repeatIntervalInput.value) || 1),
        unit: repeatUnitSelect.value,
        stopDate: repeatEndInput.value || '',
        repeatTime: itemType === 'task' ? repeatTimeInput.value || '' : '',
        daysOfWeek: Array.from(repeatWeekdayField.querySelectorAll('.weekday-pill.selected')).map((button) => Number(button.dataset.day)),
        daysOfMonth: parseMonthDays(repeatMonthdaysInput.value),
      }
    : null;

  const item = {
    id: createTaskId(),
    type: itemType,
    text,
    completed: false,
    repeatRule,
  };

  if (itemType === 'event') {
    item.startDate = normalizeDate(startDateInput.value || getTodayIso());
    item.startTime = startTimeInput.value;
    item.endTime = endTimeInput.value;

    if (!item.startTime || !item.endTime) {
      alert('Events require both start and end times.');
      return null;
    }
  } else {
    item.noDue = noDue;
    item.section = noDue ? taskSectionSelect.value : 'today';
    item.dueDate = noDue ? getTodayIso() : normalizeDate(dueDateInput.value || getTodayIso());
    item.dueTime = noDue ? '' : dueTimeInput.value;

    if (repeat && !item.dueTime && repeatTimeInput.value) {
      item.dueTime = repeatTimeInput.value;
    }
  }

  tasks.push(item);
  saveTasks();
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

function postponeTask(taskId, days) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) return task;
    if (task.noDue) return task;

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

  saveTasks();
  renderTasks();
}

function toggleTask(taskId) {
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
        repeatRule: null,
        isVirtual: false,
      };

      if (task.type === 'event') {
        completedOccurrence.startDate = currentIso;
        completedOccurrence.startTime = task.startTime;
        completedOccurrence.endTime = task.endTime;
      } else {
        completedOccurrence.dueDate = currentIso;
        completedOccurrence.dueTime = task.dueTime;
        completedOccurrence.noDue = task.noDue;
        completedOccurrence.section = task.section;
      }

      const nextOccurrence = getNextRepeatOccurrence(task);
      if (nextOccurrence) {
        const updatedTask = {
          ...task,
          dueDate: nextOccurrence.dueDate || task.dueDate,
          startDate: nextOccurrence.startDate || task.startDate,
          dueTime: nextOccurrence.dueTime ?? task.dueTime,
          startTime: nextOccurrence.startTime ?? task.startTime,
          endTime: nextOccurrence.endTime ?? task.endTime,
        };
        newTasks.push(updatedTask);
        newTasks.push(completedOccurrence);
      } else {
        newTasks.push({ ...task, completed: true, repeatRule: null });
      }

      return;
    }

    newTasks.push({ ...task, completed: !task.completed });
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
        dueTime: task.repeatRule.repeatTime || task.dueTime || '',
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
  searchToolbar.classList.toggle('hidden', tabName !== 'completed');
  if (tabName !== 'completed') {
    searchQuery = '';
    searchInput.value = '';
  }
  renderTasks();
}

function updateNoDueState() {
  const disabled = noDueCheckbox.checked;
  dueDateInput.disabled = disabled;
  dueTimeInput.disabled = disabled;
  taskSectionField.classList.toggle('hidden', !disabled);
  if (disabled) {
    dueDateInput.value = getTodayIso();
    dueTimeInput.value = '';
  }
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
  repeatTimeRow.classList.toggle('hidden', isEvent);
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

noDueCheckbox.addEventListener('change', () => {
  updateNoDueState();
  updateFormMode();
});

repeatTaskCheckbox.addEventListener('change', updateRepeatVisibility);
repeatUnitSelect.addEventListener('change', updateRepeatFieldVisibility);
itemTypeSelect.addEventListener('change', () => {
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

searchInput.addEventListener('input', (event) => {
  searchQuery = event.target.value;
  renderTasks();
});

exportJsonButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(tasks, null, 2));
    alert('Tasks copied to clipboard');
  } catch (error) {
    alert('Unable to copy to clipboard. Please allow clipboard access or copy manually.');
  }
});

importJsonButton.addEventListener('click', async () => {
  try {
    const clipboardText = await navigator.clipboard.readText();
    const imported = JSON.parse(clipboardText);
    if (!Array.isArray(imported)) throw new Error('Invalid JSON');
    tasks = imported.map((item) => ({ ...item, id: item.id || createTaskId() }));
    saveTasks();
    renderTasks();
    alert('Tasks imported from clipboard');
  } catch (error) {
    alert('Failed to import JSON. Make sure valid task JSON is on your clipboard.');
  }
});

todoInput.addEventListener('input', () => {
  const hasText = todoInput.value.trim() !== '';
  advancedOptions.classList.toggle('hidden', !hasText);
  submitRow.classList.toggle('hidden', !hasText);
});

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
  repeatTimeInput.value = '';
  repeatMonthdaysInput.value = '';
  taskSectionSelect.value = 'today';
  noDueCheckbox.checked = false;
  advancedOptions.classList.add('hidden');
  submitRow.classList.add('hidden');
  updateNoDueState();
  updateRepeatVisibility();
  updateFormMode();
  todoInput.focus();
});

async function initialize() {
  dueDateInput.value = getTodayIso();
  startDateInput.value = getTodayIso();
  itemTypeSelect.value = 'task';
  await initializeFirebase();
  updateFormMode();
  updateNoDueState();
  updateRepeatVisibility();
  submitRow.classList.add('hidden');
  setActiveTab(activeTab);
}

initialize();
