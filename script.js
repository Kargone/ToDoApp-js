const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const dueDateInput = document.getElementById('due-date');
const dueTimeInput = document.getElementById('due-time');
const noDueCheckbox = document.getElementById('no-due');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const tabButtons = document.querySelectorAll('.tab');

const STORAGE_KEY = 'todoapp-js-tasks';
let activeTab = 'today';
let tasks = loadTasks();

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(value) {
  return value ? value.slice(0, 10) : getTodayIso();
}

function getDayDifference(dueDateIso) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(`${dueDateIso}T00:00:00`);
  const diffMs = dueDate - today;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getCategory(task) {
  if (task.completed) return 'completed';
  const days = getDayDifference(task.dueDate);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 3) return 'next3';
  return 'later';
}

function formatDueLabel(task) {
  if (task.noDue) return 'No due date';

  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  const dueDate = new Date(`${task.dueDate}T00:00:00`);
  const formattedDate = dueDate.toLocaleDateString(undefined, options);

  return task.dueTime ? `${formattedDate} · ${task.dueTime}` : formattedDate;
}

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
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

function getTasksForTab() {
  return tasks.filter((task) => {
    const category = getCategory(task);
    if (activeTab === 'completed') return category === 'completed';
    return category === activeTab;
  });
}

function renderTasks() {
  todoList.innerHTML = '';
  const visibleTasks = getTasksForTab();

  if (visibleTasks.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  visibleTasks.forEach((task) => {
    const listItem = document.createElement('li');
    listItem.className = `todo-item${task.completed ? ' completed' : ''}`;

    const meta = document.createElement('div');
    const taskTitle = document.createElement('p');
    taskTitle.className = `task-title${task.completed ? ' completed' : ''}`;
    taskTitle.textContent = task.text;
    meta.appendChild(taskTitle);

    const taskMeta = document.createElement('div');
    taskMeta.className = 'todo-meta';

    const dueBadge = document.createElement('span');
    dueBadge.className = `badge due${task.noDue ? ' overdue' : ''}`;
    dueBadge.textContent = formatDueLabel(task);
    taskMeta.appendChild(dueBadge);

    if (task.completed) {
      const completeBadge = document.createElement('span');
      completeBadge.className = 'badge completed';
      completeBadge.textContent = 'Completed';
      taskMeta.appendChild(completeBadge);
    }

    meta.appendChild(taskMeta);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

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
    listItem.append(meta, actions);
    todoList.appendChild(listItem);
  });
}

function addTask(text) {
  const noDue = noDueCheckbox.checked;
  const dueDate = noDue ? getTodayIso() : normalizeDate(dueDateInput.value || getTodayIso());
  const dueTime = noDue ? '' : dueTimeInput.value;

  tasks.push({
    id: createTaskId(),
    text,
    dueDate,
    dueTime,
    noDue,
    completed: false,
  });

  saveTasks();
  renderTasks();
}

function removeTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function setActiveTab(tabName) {
  activeTab = tabName;
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
  renderTasks();
}

function updateNoDueState() {
  const disabled = noDueCheckbox.checked;
  dueDateInput.disabled = disabled;
  dueTimeInput.disabled = disabled;
  if (disabled) {
    dueDateInput.value = getTodayIso();
    dueTimeInput.value = '';
  }
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

noDueCheckbox.addEventListener('change', updateNoDueState);

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = todoInput.value.trim();
  if (!value) return;

  addTask(value);
  todoInput.value = '';
  dueTimeInput.value = '';
  noDueCheckbox.checked = false;
  updateNoDueState();
  todoInput.focus();
});

function initialize() {
  dueDateInput.value = getTodayIso();
  updateNoDueState();
  setActiveTab(activeTab);
}

initialize();
