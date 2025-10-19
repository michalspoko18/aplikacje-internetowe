class Todo {
    constructor() {
        this.storageKey = 'todoTasks';
        this.term = '';
        this.tasks = this.loadFromStorage()

        this.editingTaskId = null;
        this.taskList = document.getElementById('taskList');
        this.taskInput = document.getElementById('taskInput');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.searchInput = document.getElementById('searchInput');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.setupEventListeners();
        this.saveToStorage();
        this.draw();
    }
    
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
            console.log('Dane zapisane do LocalStorage:', this.tasks);
        } catch (error) {
            console.error('Błąd podczas zapisu do LocalStorage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                console.log('Dane załadowane z LocalStorage:', parsed);
                return parsed;
            }
        } catch (error) {
            console.error('Błąd podczas odczytu z LocalStorage:', error);
        }
        return null;
    }
    
    clearStorage() {
        localStorage.removeItem(this.storageKey);
        console.log('LocalStorage wyczyszczony');
    }
    
    getFilteredTasks() {
        if (this.term.length < 2) {
            return this.tasks;
        }
        
        return this.tasks.filter(task => 
            task.text.toLowerCase().includes(this.term.toLowerCase())
        );
    }
    
    draw() {
        this.taskList.innerHTML = '';
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = this.term.length >= 2 
                ? 'Brak zadań pasujących do wyszukiwania.' 
                : 'Brak zadań.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#666';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.padding = '20px';
            this.taskList.appendChild(emptyMessage);
            return;
        }
        
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            
            const taskSpan = document.createElement('span');
            if (this.term.length >= 2) {
                const regex = new RegExp(`(${this.term})`, 'gi');
                taskSpan.innerHTML = task.text.replace(regex, '<mark>$1</mark>');
            } else {
                taskSpan.textContent = task.text;
            }
            
            const dateSpan = document.createElement('span');
            if (task.dueDate) {
                const date = new Date(task.dueDate);
                dateSpan.textContent = `Termin: ${date.toLocaleString('pl-PL')}`;
            } else {
                dateSpan.textContent = 'Brak terminu';
            }
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edytuj';
            editBtn.style.background = '#007bff';
            editBtn.style.color = 'white';
            editBtn.style.border = 'none';
            editBtn.style.padding = '5px 10px';
            editBtn.style.marginRight = '5px';
            editBtn.style.cursor = 'pointer';
            editBtn.addEventListener('click', () => this.startEdit(task.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Usuń';
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
            
            li.appendChild(taskSpan);
            li.appendChild(dateSpan);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            
            this.taskList.appendChild(li);
        });
        
        console.log('Lista wyrenderowana, przefiltrowane zadania:', filteredTasks);
        console.log('Fraza wyszukiwania:', this.term);
    }
    
    addTask() {
        const text = this.taskInput.value.trim();
        const dueDate = this.dueDateInput.value;
        
        if (text.length < 3) {
            this.errorMessage.textContent = 'Zadanie musi mieć co najmniej 3 znaki.';
            return;
        }
        
        if (text.length > 255) {
            this.errorMessage.textContent = 'Zadanie nie może mieć więcej niż 255 znaków.';
            return;
        }
        
        if (dueDate) {
            const selectedDate = new Date(dueDate);
            const now = new Date();
            if (selectedDate <= now) {
                this.errorMessage.textContent = 'Data musi być w przyszłości.';
                return;
            }
        }
        
        const newTask = {
            id: Date.now(),
            text: text,
            dueDate: dueDate || null
        };
        
        this.tasks.push(newTask);
        this.saveToStorage();
        this.taskInput.value = '';
        this.dueDateInput.value = '';
        this.errorMessage.textContent = '';
        this.draw();
    }
    
    deleteTask(taskId) {
        if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveToStorage();
            this.draw();
        }
    }
    
    startEdit(taskId) {
        if (this.editingTaskId !== null) {
            this.saveEdit();
        }
        
        this.editingTaskId = taskId;
        const task = this.tasks.find(t => t.id === taskId);
        
        const taskElements = this.taskList.children;
        for (let li of taskElements) {
            const taskSpan = li.firstChild;
            if (taskSpan.textContent === task.text || taskSpan.innerHTML.includes(task.text)) {
                const editContainer = document.createElement('div');
                editContainer.style.display = 'flex';
                editContainer.style.gap = '10px';
                editContainer.style.alignItems = 'center';
                editContainer.style.flex = '1';
                
                const editTextInput = document.createElement('input');
                editTextInput.type = 'text';
                editTextInput.value = task.text;
                editTextInput.maxLength = 255;
                editTextInput.style.flex = '2';
                editTextInput.className = 'edit-text-input';
                
                const editDateInput = document.createElement('input');
                editDateInput.type = 'datetime-local';
                editDateInput.value = task.dueDate || '';
                editDateInput.style.flex = '1';
                editDateInput.className = 'edit-date-input';
                
                const saveBtn = document.createElement('button');
                saveBtn.textContent = 'Zapisz';
                saveBtn.style.background = 'green';
                saveBtn.style.color = 'white';
                saveBtn.style.border = 'none';
                saveBtn.style.padding = '5px 10px';
                saveBtn.style.cursor = 'pointer';
                saveBtn.addEventListener('click', () => this.saveEdit());
                
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Anuluj';
                cancelBtn.style.background = 'gray';
                cancelBtn.style.color = 'white';
                cancelBtn.style.border = 'none';
                cancelBtn.style.padding = '5px 10px';
                cancelBtn.style.cursor = 'pointer';
                cancelBtn.addEventListener('click', () => this.cancelEdit());
                
                editContainer.appendChild(editTextInput);
                editContainer.appendChild(editDateInput);
                editContainer.appendChild(saveBtn);
                editContainer.appendChild(cancelBtn);
                
                li.removeChild(taskSpan);
                li.removeChild(li.firstChild);
                li.insertBefore(editContainer, li.firstChild);
                
                editTextInput.focus();
                editTextInput.select();
                
                editTextInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.saveEdit();
                    if (e.key === 'Escape') this.cancelEdit();
                });
                
                editDateInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.saveEdit();
                    if (e.key === 'Escape') this.cancelEdit();
                });
                
                break;
            }
        }
    }
    
    saveEdit() {
        if (this.editingTaskId === null) return;
        
        const taskElements = this.taskList.children;
        for (let li of taskElements) {
            const textInput = li.querySelector('.edit-text-input');
            const dateInput = li.querySelector('.edit-date-input');
            
            if (textInput && dateInput) {
                const newText = textInput.value.trim();
                const newDate = dateInput.value;
                
                if (newText.length >= 3 && newText.length <= 255) {
                    let isDateValid = true;
                    if (newDate) {
                        const selectedDate = new Date(newDate);
                        const now = new Date();
                        if (selectedDate <= now) {
                            alert('Data musi być w przyszłości.');
                            isDateValid = false;
                        }
                    }
                    
                    if (isDateValid) {
                        const task = this.tasks.find(t => t.id === this.editingTaskId);
                        task.text = newText;
                        task.dueDate = newDate || null;
                        this.saveToStorage();
                        this.editingTaskId = null;
                        this.draw();
                        return;
                    }
                } else {
                    alert('Zadanie musi mieć od 3 do 255 znaków.');
                }
                break;
            }
        }
    }
    
    cancelEdit() {
        this.editingTaskId = null;
        this.draw();
    }
    
    search() {
        this.term = this.searchInput.value.trim();
        this.draw();
    }
    
    setupEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        this.searchInput.addEventListener('input', () => this.search());
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#taskList') && this.editingTaskId !== null) {
                this.saveEdit();
            }
        });
    }
}

window.onload = function() {
    const todoApp = new Todo();
    window.todoApp = todoApp;
    
    console.log('Todo App załadowane');
};