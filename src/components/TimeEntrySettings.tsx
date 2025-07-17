import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TaskType, Project, Client } from '@/types';
import { Plus, Trash2, Edit3 } from 'lucide-react';

export const TimeEntrySettings: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskRate, setNewTaskRate] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    
    const newTask: TaskType = {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      hourlyRate: newTaskRate ? parseFloat(newTaskRate) : undefined,
    };

    updateSettings({
      taskTypes: [...settings.taskTypes, newTask],
    });

    setNewTaskName('');
    setNewTaskRate('');
  };

  const handleDeleteTask = (taskId: string) => {
    updateSettings({
      taskTypes: settings.taskTypes.filter(task => task.id !== taskId),
    });
  };

  const handleUpdateTask = (task: TaskType) => {
    updateSettings({
      taskTypes: settings.taskTypes.map(t => t.id === task.id ? task : t),
    });
    setEditingTask(null);
  };

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
    };

    updateSettings({
      projects: [...settings.projects, newProject],
    });

    setNewProjectName('');
  };

  const handleDeleteProject = (projectId: string) => {
    updateSettings({
      projects: settings.projects.filter(project => project.id !== projectId),
    });
  };

  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    
    const newClient: Client = {
      id: Date.now().toString(),
      name: newClientName.trim(),
    };

    updateSettings({
      clients: [...settings.clients, newClient],
    });

    setNewClientName('');
  };

  const handleDeleteClient = (clientId: string) => {
    updateSettings({
      clients: settings.clients.filter(client => client.id !== clientId),
    });
  };


  return (
    <div className="px-5 py-4 space-y-6">
      {/* Task Types */}
      <section>
        <h3 className="text-[#09121F] text-[18px] font-bold mb-3">Task Types</h3>
        
        {/* Add New Task */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Task name"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded text-[#09121F]"
          />
          {settings.invoiceMode && (
            <input
              type="number"
              placeholder="Rate"
              value={newTaskRate}
              onChange={(e) => setNewTaskRate(e.target.value)}
              className="w-20 p-2 border border-gray-300 rounded text-[#09121F]"
            />
          )}
          <button
            onClick={handleAddTask}
            className="p-2 bg-[#09121F] text-white rounded hover:bg-[#1a1a1a]"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {settings.taskTypes.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              {editingTask?.id === task.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={editingTask.name}
                    onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                    className="flex-1 p-1 border border-gray-300 rounded text-[#09121F]"
                  />
                  {settings.invoiceMode && (
                    <input
                      type="number"
                      value={editingTask.hourlyRate || ''}
                      onChange={(e) => setEditingTask({ 
                        ...editingTask, 
                        hourlyRate: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      className="w-20 p-1 border border-gray-300 rounded text-[#09121F]"
                    />
                  )}
                  <button
                    onClick={() => handleUpdateTask(editingTask)}
                    className="px-3 py-1 bg-[#09121F] text-white rounded text-sm"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-[#09121F] font-medium">{task.name}</span>
                    {settings.invoiceMode && task.hourlyRate && (
                      <span className="text-[#BFBFBF] ml-2">${task.hourlyRate}/hr</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1 text-[#BFBFBF] hover:text-[#09121F]"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-[#BFBFBF] hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section>
        <h3 className="text-[#09121F] text-[18px] font-bold mb-3">Projects</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded text-[#09121F]"
          />
          <button
            onClick={handleAddProject}
            className="p-2 bg-[#09121F] text-white rounded hover:bg-[#1a1a1a]"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {settings.projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-[#09121F] font-medium">{project.name}</span>
              <button
                onClick={() => handleDeleteProject(project.id)}
                className="p-1 text-[#BFBFBF] hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Clients */}
      <section>
        <h3 className="text-[#09121F] text-[18px] font-bold mb-3">Clients</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Client name"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded text-[#09121F]"
          />
          <button
            onClick={handleAddClient}
            className="p-2 bg-[#09121F] text-white rounded hover:bg-[#1a1a1a]"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {settings.clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-[#09121F] font-medium">{client.name}</span>
              <button
                onClick={() => handleDeleteClient(client.id)}
                className="p-1 text-[#BFBFBF] hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};