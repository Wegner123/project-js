class TaskModel {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    }

    _commit(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    addTask(taskData) {
        const task = {
            id: Date.now().toString(),
            title: taskData.title,
            description: taskData.description || '',
            dueDate: taskData.dueDate || null,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this._commit(this.tasks);
        return task;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this._commit(this.tasks);
    }

    getTaskById(id) {
        return this.tasks.find(task => task.id === id);
    }

    updateTask(id, updatedData) {
        this.tasks = this.tasks.map(task =>
            task.id === id ? { ...task, ...updatedData, updatedAt: new Date().toISOString() } : task
        );
        this._commit(this.tasks);
        return this.getTaskById(id);
    }

    getAllTasks() {
        return this.tasks;
    }

    toggleTaskCompletion(id) {
        const task = this.getTaskById(id);
        if (task) {
            task.completed = !task.completed;
            this.updateTask(id, { completed: task.completed });
        }
        return task;
    }

    exportData() {
        return JSON.stringify(this.tasks);
    }

    importData(jsonData) {
        try {
            const importedTasks = JSON.parse(jsonData);
            if (Array.isArray(importedTasks) && importedTasks.every(task => task.id && task.title)) {
                this.tasks = importedTasks;
                this._commit(this.tasks);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Błąd podczas importu danych:", error);
            return false;
        }
    }
}

class TaskView {
    constructor() {
        this.taskList = document.getElementById('taskList');
        this.taskForm = document.getElementById('addTaskForm');
        this.taskTitleInput = document.getElementById('taskTitle');
        this.taskDescriptionInput = document.getElementById('taskDescription');
        this.taskDueDateInput = document.getElementById('taskDueDate');

        this.exportButton = document.getElementById('exportData');
        this.importFileLabel = document.querySelector('label[for="importFile"]');
        this.importFileInput = document.getElementById('importFile');
        this.createEditModal();
    }
    createEditModal() {
        if (!document.getElementById('editTaskModal')) {
            this.editModal = document.createElement('div');
            this.editModal.className = 'modal';
            this.editModal.id = 'editTaskModal';
            this.editModal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Edytuj zadanie</h2>
                    <form id="editTaskForm">
                        <div>
                            <label for="editTaskTitle">Tytuł zadania:</label>
                            <input type="text" id="editTaskTitle" required>
                        </div>
                        <div>
                            <label for="editTaskDescription">Opis:</label>
                            <textarea id="editTaskDescription"></textarea>
                        </div>
                        <div>
                            <label for="editTaskDueDate">Termin wykonania:</label>
                            <input type="date" id="editTaskDueDate">
                        </div>
                        <input type="hidden" id="editTaskId">
                        <button type="submit">Zapisz zmiany</button>
                    </form>
                </div>
            `;
            document.body.appendChild(this.editModal);
        } else {
            this.editModal = document.getElementById('editTaskModal');
        }
        
        this.editTaskForm = document.getElementById('editTaskForm');
        this.editTaskTitleInput = document.getElementById('editTaskTitle');
        this.editTaskDescriptionInput = document.getElementById('editTaskDescription');
        this.editTaskDueDateInput = document.getElementById('editTaskDueDate');
        this.editTaskIdInput = document.getElementById('editTaskId');
        this.closeModalBtn = document.querySelector('#editTaskModal .close');
    }

    displayTasks(tasks) {
        while (this.taskList.firstChild) {
            this.taskList.removeChild(this.taskList.firstChild);
        }

        if (tasks.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'Brak zadań do wyświetlenia.';
            this.taskList.appendChild(p);
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.id = `task-${task.id}`;
            li.className = task.completed ? 'completed' : '';

            const taskDetails = document.createElement('div');
            taskDetails.className = 'task-details';

            const title = document.createElement('h3');
            title.textContent = task.title;

            const description = document.createElement('p');
            description.textContent = task.description || 'Brak opisu.';

            const dueDate = document.createElement('p');
            dueDate.textContent = task.dueDate ? `Termin: ${new Date(task.dueDate).toLocaleDateString()}` : 'Brak terminu.';
            
            const createdAt = document.createElement('p');
            createdAt.textContent = `Utworzono: ${new Date(task.createdAt).toLocaleString()}`;
            createdAt.style.fontSize = '0.8em';
            createdAt.style.color = '#777';


            taskDetails.appendChild(title);
            taskDetails.appendChild(description);
            taskDetails.appendChild(dueDate);
            taskDetails.appendChild(createdAt);


            const actions = document.createElement('div');
            actions.className = 'actions';

            const completeButton = document.createElement('button');
            completeButton.textContent = task.completed ? 'Oznacz jako nieukończone' : 'Oznacz jako ukończone';
            completeButton.dataset.id = task.id;
            completeButton.className = 'complete-btn';

            const editButton = document.createElement('button');
            editButton.textContent = 'Edytuj';
            editButton.dataset.id = task.id;
            editButton.className = 'edit-btn';

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Usuń';
            deleteButton.dataset.id = task.id;
            deleteButton.className = 'delete-btn';

            actions.appendChild(completeButton);
            actions.appendChild(editButton);
            actions.appendChild(deleteButton);

            li.appendChild(taskDetails);
            li.appendChild(actions);
            this.taskList.appendChild(li);
        });
    }

    getTaskInput() {
        return {
            title: this.taskTitleInput.value,
            description: this.taskDescriptionInput.value,
            dueDate: this.taskDueDateInput.value
        };
    }

    resetTaskInput() {
        this.taskTitleInput.value = '';
        this.taskDescriptionInput.value = '';
        this.taskDueDateInput.value = '';
    }

    bindAddTask(handler) {
        this.taskForm.addEventListener('submit', event => {
            event.preventDefault();
            const taskData = this.getTaskInput();
            if (taskData.title) {
                handler(taskData);
                this.resetTaskInput();
            }
        });
    }

    bindDeleteTask(handler) {
        this.taskList.addEventListener('click', event => {
            if (event.target.classList.contains('delete-btn')) {
                const id = event.target.dataset.id;
                handler(id);
            }
        });
    }

    bindToggleTask(handler) {
        this.taskList.addEventListener('click', event => {
            if (event.target.classList.contains('complete-btn')) {
                const id = event.target.dataset.id;
                handler(id);
            }
        });
    }
    
    bindEditTask(handler) {
        this.taskList.addEventListener('click', event => {
            if (event.target.classList.contains('edit-btn')) {
                const id = event.target.dataset.id;
                handler(id);
            }
        });
        
        this.closeModalBtn.addEventListener('click', () => {
            this.hideEditModal();
        });
        
        window.addEventListener('click', event => {
            if (event.target === this.editModal) {
                this.hideEditModal();
            }
        });
        
        this.editTaskForm.addEventListener('submit', event => {
            event.preventDefault();
            const updatedData = {
                title: this.editTaskTitleInput.value,
                description: this.editTaskDescriptionInput.value,
                dueDate: this.editTaskDueDateInput.value || null
            };
            const taskId = this.editTaskIdInput.value;
            handler(taskId, updatedData, true);
            this.hideEditModal();
        });
    }
    
    showEditModal(task) {
        this.editTaskTitleInput.value = task.title;
        this.editTaskDescriptionInput.value = task.description || '';
        this.editTaskDueDateInput.value = task.dueDate || '';
        this.editTaskIdInput.value = task.id;
        this.editModal.style.display = 'block';
    }
    
    hideEditModal() {
        this.editModal.style.display = 'none';
    }

    bindExportData(handler) {
        this.exportButton.addEventListener('click', () => {
            handler();
        });
    }

    bindImportData(handler) {
        this.importFileInput.addEventListener('change', event => {
            const file = event.target.files[0];
            if (file) {
                handler(file);
                event.target.value = null;
            }
        });
    }

    triggerDownload(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}

class TaskController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.view.bindAddTask(this.handleAddTask.bind(this));
        this.view.bindDeleteTask(this.handleDeleteTask.bind(this));
        this.view.bindToggleTask(this.handleToggleTask.bind(this));
        this.view.bindEditTask(this.handleEditTask.bind(this));
        this.view.bindExportData(this.handleExportData.bind(this));
        this.view.bindImportData(this.handleImportData.bind(this));
        this.onTasksChanged(this.model.getAllTasks());
    }

    onTasksChanged(tasks) {
        this.view.displayTasks(tasks);
    }

    handleAddTask(taskData) {
        this.model.addTask(taskData);
        this.onTasksChanged(this.model.getAllTasks());
    }

    handleDeleteTask(id) {
        this.model.deleteTask(id);
        this.onTasksChanged(this.model.getAllTasks());
    }

    handleToggleTask(id) {
        this.model.toggleTaskCompletion(id);
        this.onTasksChanged(this.model.getAllTasks());
    }

    handleEditTask(id, updatedData, isFormSubmit) {
        if (isFormSubmit) {
            this.model.updateTask(id, updatedData);
            this.onTasksChanged(this.model.getAllTasks());
        } else {
            const task = this.model.getTaskById(id);
            if (task) {
                this.view.showEditModal(task);
            }
        }
    }

    handleExportData() {
        const data = this.model.exportData();
        const filename = `tasks_export_${new Date().toISOString().slice(0, 10)}.json`;
        this.view.triggerDownload(filename, data);
    }

    handleImportData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const success = this.model.importData(e.target.result);
            if (success) {
                this.onTasksChanged(this.model.getAllTasks());
                alert('Dane zostały zaimportowane pomyślnie.');
            } else {
                alert('Błąd importu danych. Sprawdź format pliku.');
            }
        };
        reader.readAsText(file);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const app = new TaskController(new TaskModel(), new TaskView());
});