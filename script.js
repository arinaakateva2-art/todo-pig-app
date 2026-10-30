let tasks = [];
let myModal;

document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] Приложение инициализировано");
    loadTasks();
    myModal = new bootstrap.Modal(document.getElementById('taskModal'));
    renderTasks();

    document.getElementById('filterSelect').addEventListener('change', renderTasks);
    document.getElementById('sortSelect').addEventListener('change', renderTasks);
});

function loadTasks() {
    try {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            tasks = JSON.parse(saved);
            console.log(`[DEBUG] Загружено ${tasks.length} задач из LocalStorage`);
        }
    } catch (error) {
        console.error("[ERROR] Ошибка при загрузке задач:", error);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log("[DEBUG] Задачи сохранены в LocalStorage");
    } catch (error) {
        console.error("[ERROR] Ошибка сохранения:", error);
    }
}

function openAddModal() {
    console.log("[DEBUG] Открытие модального окна для создания");
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('modalTitle').textContent = 'Новая задача';
    document.getElementById('statusGroup').style.display = 'none'; 
    myModal.show();
}

function openEditModal(id) {
    console.log(`[DEBUG] Редактирование задачи ID: ${id}`);
    const task = tasks.find(t => t.id === id);
    if (!task) {
        console.error(`[ERROR] Задача с ID ${id} не найдена`);
        return;
    }

    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDesc').value = task.description;
    document.getElementById('taskDate').value = task.date;
    
    document.getElementById('statusGroup').style.display = 'block';
    document.getElementById('taskStatus').value = task.status;

    document.getElementById('modalTitle').textContent = 'Редактировать задачу';
    myModal.show();
}

function saveTask() {
    const idInput = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const desc = document.getElementById('taskDesc').value.trim();
    const date = document.getElementById('taskDate').value;
    
    if (!title || !date) {
        alert("Пожалуйста, заполните название и дату.");
        return;
    }

    if (idInput) {
        const index = tasks.findIndex(t => t.id === idInput);
        if (index !== -1) {
            tasks[index].title = title;
            tasks[index].description = desc;
            tasks[index].date = date;
            tasks[index].status = document.getElementById('taskStatus').value;
            console.log(`[DEBUG] Задача ${idInput} обновлена`);
        }
    } else {
        const newTask = {
            id: Date.now().toString(), 
            title: title,
            description: desc,
            date: date,
            status: 'pending', 
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        console.log("[DEBUG] Создана новая задача:", newTask);
    }

    saveToStorage();
    renderTasks();
    myModal.hide();
}

function deleteTask(id) {
    if (confirm("Вы уверены, что хотите удалить задачу?")) {
        console.log(`[DEBUG] Удаление задачи ID: ${id}`);
        tasks = tasks.filter(t => t.id !== id);
        saveToStorage();
        renderTasks();
    }
}

function changeStatus(id, newStatus) {
    console.log(`[DEBUG] Изменение статуса задачи ${id} на ${newStatus}`);
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = newStatus;
        saveToStorage();
        renderTasks();
    }
}


function renderTasks() {
    const listContainer = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const filter = document.getElementById('filterSelect').value;
    const sort = document.getElementById('sortSelect').value;

    console.log(`[DEBUG] Рендер: Фильтр=${filter}, Сортировка=${sort}`);

    let filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        return task.status === filter;
    });

    filteredTasks.sort((a, b) => {
        if (sort === 'date-new') {
            return new Date(b.date) - new Date(a.date);
        } else if (sort === 'date-old') {
            return new Date(a.date) - new Date(b.date);
        } else if (sort === 'alphabet') {
            return a.title.localeCompare(b.title);
        }
    });

    listContainer.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.classList.remove('d-none');
    } else {
        emptyState.classList.add('d-none');
        
        filteredTasks.forEach(task => {
            let statusClass = 'status-pending';
            let statusText = 'Не выполнена';
            let badgeClass = 'bg-danger';
            
            if (task.status === 'done') {
                statusClass = 'status-done';
                statusText = 'Выполнена';
                badgeClass = 'bg-success';
            } else if (task.status === 'in-progress') {
                statusClass = 'status-in-progress';
                statusText = 'В процессе';
                badgeClass = 'bg-warning text-dark';
            }

            const dateObj = new Date(task.date);
            const formattedDate = dateObj.toLocaleDateString('ru-RU');

            const html = `
                <div class="col-12">
                    <div class="card task-card ${statusClass} shadow-sm">
                        <div class="card-body d-flex justify-content-between align-items-center flex-wrap">
                            <div class="mb-2 mb-md-0">
                                <h5 class="card-title ${task.status === 'done' ? 'task-done-text' : ''} mb-1">
                                    ${escapeHtml(task.title)}
                                </h5>
                                <p class="card-text text-muted small mb-1">${escapeHtml(task.description || 'Без описания')}</p>
                                <small class="text-secondary"><i class="bi bi-calendar"></i> Срок: ${formattedDate}</small>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge ${badgeClass} badge-status">${statusText}</span>
                                
                                <select class="form-select form-select-sm w-auto" onchange="changeStatus('${task.id}', this.value)">
                                    <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Не выполнена</option>
                                    <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>В процессе</option>
                                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>Выполнена</option>
                                </select>

                                <button class="btn btn-sm btn-outline-primary" onclick="openEditModal('${task.id}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task.id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', html);
        });
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}