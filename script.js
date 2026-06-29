const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');

const tasks = [];

function renderTasks() {
  todoList.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  tasks.forEach((task, index) => {
    const listItem = document.createElement('li');
    listItem.className = `todo-item${task.completed ? ' completed' : ''}`;

    const text = document.createElement('p');
    text.className = 'task-text';
    text.textContent = task.text;
    text.addEventListener('click', () => toggleTask(index));

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Remove';
    deleteButton.addEventListener('click', () => removeTask(index));

    listItem.append(text, deleteButton);
    todoList.appendChild(listItem);
  });
}

function addTask(text) {
  tasks.push({ text, completed: false });
  renderTasks();
}

function removeTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks();
}

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = todoInput.value.trim();
  if (!value) return;

  addTask(value);
  todoInput.value = '';
  todoInput.focus();
});

renderTasks();
