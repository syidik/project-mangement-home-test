// API Configuration
const API_BASE_URL = 'http://127.0.0.1:3000/api';
let projects = [];
let currentTask = null;

// DOM Elements
const projectsList = document.getElementById('projects-list');
const loadingMessage = document.getElementById('loading-message');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const projectModal = document.getElementById('modal-project');
const taskModal = document.getElementById('modal-task');

// Buttons
const addProjectBtn = document.getElementById('add-project-btn');
const addTaskBtn = document.getElementById('add-task-btn');
const cancelProjectBtn = document.getElementById('cancel-project-btn');
const saveProjectBtn = document.getElementById('save-project-btn');
const deleteProjectBtn = document.getElementById('delete-project-btn');

const cancelTaskBtn = document.getElementById('cancel-task-btn');
const saveTaskBtn = document.getElementById('save-task-btn');
const deleteTaskBtn = document.getElementById('delete-task-btn');

// Form Inputs
const projectNameInput = document.getElementById('project-name');
const projectStatusSelect = document.getElementById('project-status');
const taskProjectSelect = document.getElementById('task-project');
const taskNameInput = document.getElementById('task-name');
const taskStatusSelect = document.getElementById('task-status');
const taskWeightInput = document.getElementById('task-weight');
const projectModalTitle = document.getElementById('project-modal-title');
const taskModalTitle = document.getElementById('task-modal-title');

// Load projects when page loads
document.addEventListener('DOMContentLoaded', loadProjects);

// Event Listeners
addProjectBtn.addEventListener('click', () => openProjectModal());
addTaskBtn.addEventListener('click', () => openTaskModal());
saveProjectBtn.addEventListener('click', saveProject);
deleteProjectBtn.addEventListener('click', deleteProject);
saveTaskBtn.addEventListener('click', saveTask);
deleteTaskBtn.addEventListener('click', deleteCurrentTask);
modalOverlay.addEventListener('click', closeAllModals);

async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/projects`);
        if (!response.ok) throw new Error('Failed to load projects');
        projects = await response.json();
        renderProjects(projects);
        loadingMessage.style.display = 'none';
    } catch (error) {
        console.error('Error loading projects:', error);
        loadingMessage.textContent = 'Error loading projects. Please try again.';
        projects = [];
        renderProjects(projects);
    }
}

function renderProjects(projects) {
    projectsList.innerHTML = '';

    if (projects.length === 0) {
        projectsList.innerHTML = '<div class="text-center p-4 text-gray-500">No projects found</div>';
        return;
    }

    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.id = `project-${project.id}`;
        projectElement.className = 'project-item';

        const tasksList = project.tasks?.map(task => `
                <div class="p-3 flex items-center justify-between hover:bg-gray-50 task-item" data-project-id="${project.id}" data-task-id="${task.id}">
                    <div>
                        <span class="font-medium">${task.nama}</span>
                        <span class="ml-3 text-sm text-gray-500">(${task.status}, Bobot: ${task.bobot})</span>
                    </div>
                </div>
            `).join('') || '';

        projectElement.innerHTML = `
                <div class="p-2 flex cursor-pointer project-header">
                    <div class="flex items-center">
                        <i class="p-2 fas fa-chevron-down text-gray-400 transition-transform exp-colp"></i>
                        <h3 class="font-semibold project-title">${project.nama} (${project.status}, ${project.completion_progress}%)</h3>
                        <span class="ml-3 text-sm text-gray-500">
                            <button class="add-task-to-project px-3 py-1 bg-sky-600 text-white rounded cursor-pointer hover:bg-sky-700" 
                                    data-project-id="${project.id}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </span>
                    </div>
                </div>
                <div class="pl-12 pb-2 pr-6 project-tasks">
                    <ul class="divide-y divide-gray-200" id="tasks-${project.id}">
                        ${tasksList}
                    </ul>
                </div>
            `;

        projectsList.appendChild(projectElement);

        const header = projectElement.querySelector('.project-header');
        const tasksSection = projectElement.querySelector('.project-tasks');
        const chevron = header.querySelector('.exp-colp');

        chevron.addEventListener('click', (e) => {
            e.stopPropagation();
                const isHidden = tasksSection.classList.contains('hidden');
                tasksSection.classList.toggle('hidden', !isHidden);
                chevron.style.transform = isHidden ? 'rotate(0)' : 'rotate(-90deg)';
        })

        header.addEventListener('click', (e) => {
            e.stopPropagation();
            openProjectModal(project)
        });

        const addTaskButton = projectElement.querySelector('.add-task-to-project');
        addTaskButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openTaskModal(project.id);
        });

        const taskItems = projectElement.querySelectorAll('.task-item');
        taskItems.forEach(taskItem => {
            taskItem.addEventListener('click', (e) => {
                const projectId = taskItem.dataset.projectId;
                const taskId = taskItem.dataset.taskId;
                const task = projects.find(p => p.id == projectId)?.tasks?.find(t => t.id == taskId);
                if (task) {
                    openTaskModal(projectId, task);
                }
            });
        });
    });
}

function openProjectModal(project = null) {
    if (project) {
        projectModalTitle.textContent = 'Edit Project';
        projectNameInput.value = project.nama;
        projectStatusSelect.value = project.status;
        saveProjectBtn.dataset.projectId = project.id;
        deleteProjectBtn.dataset.projectId = project.id;
        deleteProjectBtn.style.display = 'inline-block';
    } else {
        projectModalTitle.textContent = 'Add Project';
        projectNameInput.value = '';
        projectStatusSelect.value = 'Draft';
        delete saveProjectBtn.dataset.projectId;
        delete deleteProjectBtn.dataset.projectId;
        deleteProjectBtn.style.display = 'none';
    }

    projectModal.classList.remove('translate-x-full');
    modalOverlay.classList.remove('hidden');
}

async function saveProject() {
    const projectName = projectNameInput.value.trim();
    const projectStatus = projectStatusSelect.value;
    const projectId = saveProjectBtn.dataset.projectId;

    if (!projectName) {
        alert('Please enter a project name');
        return;
    }

    try {
        const url = projectId ? `${API_BASE_URL}/projects/${projectId}` : `${API_BASE_URL}/projects`;
        const method = projectId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nama: projectName,
                status: projectStatus,
                completion_progress: 0
            }),
        });
        if (!response.ok) throw new Error('Failed to save project');

        const responseBody = await response.json();

        if(projectId)
        {
            loadProjects();
        } else
        {   
            projects.push(responseBody)
            appendProject(responseBody)
        }
        closeProjectModal();
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Failed to save project');
    }
}

function appendProject(project) {
    const projectElement = document.createElement('div');
    projectElement.id = `project-${project.id}`;
    projectElement.className = 'project-item';

    projectElement.innerHTML = `
        <div class="p-2 flex cursor-pointer project-header">
            <div class="flex items-center">
                <i class="p-2 fas fa-chevron-down text-gray-400 transition-transform exp-colp"></i>
                <h3 class="font-semibold project-title">${project.nama} (${project.status}, ${project.completion_progress}%)</h3>
                <span class="ml-3 text-sm text-gray-500">
                    <button class="add-task-to-project px-3 py-1 bg-sky-600 text-white rounded cursor-pointer hover:bg-sky-700" 
                            data-project-id="${project.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </span>
            </div>
        </div>
        <div class="pl-12 pb-2 pr-6 project-tasks">
            <ul class="divide-y divide-gray-200" id="tasks-${project.id}">
            </ul>
        </div>
    `;

    projectsList.appendChild(projectElement);

    const header = projectElement.querySelector('.project-header');
    const tasksSection = projectElement.querySelector('.project-tasks');
    const chevron = header.querySelector('.exp-colp');

    chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = tasksSection.classList.contains('hidden');
        tasksSection.classList.toggle('hidden', !isHidden);
        chevron.style.transform = isHidden ? 'rotate(0)' : 'rotate(-90deg)';
    })

    header.addEventListener('click', (e) => {
        e.stopPropagation();
        openProjectModal(project)
    });

    const addTaskButton = projectElement.querySelector('.add-task-to-project');
    addTaskButton.addEventListener('click', (e) => {
        e.stopPropagation();
        openTaskModal(project.id);
    });

    const taskItems = projectElement.querySelectorAll('.task-item');
    taskItems.forEach(taskItem => {
        taskItem.addEventListener('click', (e) => {
            const projectId = taskItem.dataset.projectId;
            const taskId = taskItem.dataset.taskId;
            const task = projects.find(p => p.id == projectId)?.tasks?.find(t => t.id == taskId);
            if (task) {
                openTaskModal(projectId, task);
            }
        });
    });
    projectsList.addEventListener('click', function (e) {
        // Check if a task item was clicked
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            const projectId = taskItem.dataset.projectId;
            const taskId = taskItem.dataset.taskId;
            const task = projects.find(p => p.id == projectId)?.tasks?.find(t => t.id == taskId);
            if (task) {
                openTaskModal(projectId, task);
            }
        }
    });
}
async function deleteProject() {
    const projectId = saveProjectBtn.dataset.projectId;
    if (!confirm('Anda yakin ingin menghapus Project ini?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete project');

        closeProjectModal();
        loadProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
    }
}

function openTaskModal(projectId = null, task = null) {
    taskProjectSelect.innerHTML = projects.map(project =>
        `<option value="${project.id}" ${projectId === project.id ? 'selected' : ''}>${project.nama}</option>`
    ).join('');

    if (task) {
        // Edit mode
        currentTask = task;
        taskModalTitle.textContent = 'Edit Task';
        taskNameInput.value = task.nama;
        taskStatusSelect.value = task.status;
        taskWeightInput.value = task.bobot;
        saveTaskBtn.textContent = 'Simpan';
        deleteTaskBtn.style.display = 'inline-block';
    } else {
        // Add mode
        currentTask = null;
        taskModalTitle.textContent = 'Add Task';
        taskNameInput.value = '';
        taskStatusSelect.value = 'Draft';
        taskWeightInput.value = '1';
        saveTaskBtn.textContent = 'Simpan';
        deleteTaskBtn.style.display = 'none';
    }

    taskModal.classList.remove('translate-x-full');
    modalOverlay.classList.remove('hidden');
}

async function saveTask() {
    const projectId = taskProjectSelect.value;
    const taskName = taskNameInput.value.trim();
    const taskStatus = taskStatusSelect.value;
    const taskWeight = parseInt(taskWeightInput.value) || 0;

    if (!taskName) {
        alert('Please enter a task name');
        return;
    }

    try {
        const url = currentTask ?
            `${API_BASE_URL}/tasks/${currentTask.id}` :
            `${API_BASE_URL}/tasks`;
        const method = currentTask ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nama: taskName,
                status: taskStatus,
                bobot: taskWeight,
                project: projectId
            }),
        });

        if (!response.ok) throw new Error('Failed to save task');

        // const responseBody = await response.json();

        // // if (currentTask) {
        // //     updateProject(responseBody)
        // // } else {
        // //     appendTask(responseBody)
        // // }

        closeTaskModal();
        loadProjects()
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task');
    }
}

function appendTask(task){
    const taskProjectSelect = document.getElementById(`tasks-${task.project}`);

    const taskElement = document.createElement('div');
    taskElement.className = 'p-3 flex items-center justify-between hover:bg-gray-50 task-item';
    taskElement.dataset.projectId = task.project;
    taskElement.dataset.taskId = task.id;

    taskElement.innerHTML = `
        <div>
            <span class="font-medium">${task.nama}</span>
            <span class="ml-3 text-sm text-gray-500">(${task.status}, Bobot: ${task.bobot})</span>
        </div>
    `;

    taskElement.addEventListener('click', (e) => {
        const projectId = taskElement.dataset.projectId;
        const taskId = taskElement.dataset.taskId;
        const taskObj = projects.find(p => p.id == projectId)?.tasks?.find(t => t.id == taskId);
        if (taskObj) {
            openTaskModal(projectId, taskObj);
        }
    });

    taskProjectSelect.appendChild(taskElement)
}
async function deleteCurrentTask() {
    if (!currentTask) return;
    if (!confirm('Anda yakin ingin menghapus Task ini?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${currentTask.id}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete task');

        closeTaskModal();
        loadProjects();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
    }
}

function closeProjectModal() {
    projectModal.classList.add('translate-x-full');
    modalOverlay.classList.add('hidden');
}

function closeTaskModal() {
    taskModal.classList.add('translate-x-full');
    modalOverlay.classList.add('hidden');
    currentTask = null;
}

function closeAllModals() {
    closeProjectModal();
    closeTaskModal();
}