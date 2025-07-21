import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TaskType, Project, Client } from '@/types';
import { Edit3, Trash2 } from 'lucide-react';

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
    <div>
      {/* Clients */}
      <section className="px-5 pb-4">
        <div className="border-b border-gray-200 pb-2 mb-3">
          <h3 className="text-[#09121F] text-lg font-bold">Clients</h3>
        </div>
        
        <div className="space-y-3">
          {settings.clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between py-2">
              <span className="text-[#09121F] text-sm">{client.name}</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingClient(client)}
                  className="text-gray-400 hover:text-[#09121F]"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteClient(client.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between py-2">
            <input
              type="text"
              placeholder="Add client"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
            />
            <button
              onClick={handleAddClient}
              className="w-6 h-6 bg-[#09121F] text-white rounded flex items-center justify-center text-xs font-bold"
            >
              +
            </button>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="px-5 pb-4">
        <div className="border-b border-gray-200 pb-2 mb-3">
          <h3 className="text-[#09121F] text-lg font-bold">Projects</h3>
        </div>
        
        <div className="space-y-3">
          {settings.projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between py-2">
              <span className="text-[#09121F] text-sm">{project.name}</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingProject(project)}
                  className="text-gray-400 hover:text-[#09121F]"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between py-2">
            <input
              type="text"
              placeholder="Add project"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
            />
            <button
              onClick={handleAddProject}
              className="w-6 h-6 bg-[#09121F] text-white rounded flex items-center justify-center text-xs font-bold"
            >
              +
            </button>
          </div>
        </div>
      </section>

      {/* Tasks */}
      <section className="px-5 pb-4">
        <div className="border-b border-gray-200 pb-2 mb-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[#09121F] text-lg font-bold">Tasks</h3>
            {settings.invoiceMode && (
              <h3 className="text-[#09121F] text-lg font-bold">Hourly Rate</h3>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {settings.taskTypes.map((task) => (
            <div key={task.id} className="flex items-center justify-between py-2">
              <span className="text-[#09121F] text-sm">{task.name}</span>
              <div className="flex items-center gap-3">
                {settings.invoiceMode && (
                  <span className="text-[#09121F] text-sm min-w-[60px] text-right">
                    ${task.hourlyRate || '0.00'}
                  </span>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="text-gray-400 hover:text-[#09121F]"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between py-2">
            <input
              type="text"
              placeholder="Add task type"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1"
            />
            <div className="flex items-center gap-3">
              {settings.invoiceMode && (
                <input
                  type="text"
                  placeholder="$0.00"
                  value={newTaskRate}
                  onChange={(e) => setNewTaskRate(e.target.value)}
                  className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none w-16 text-right"
                />
              )}
              <button
                onClick={handleAddTask}
                className="w-6 h-6 bg-[#09121F] text-white rounded flex items-center justify-center text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};