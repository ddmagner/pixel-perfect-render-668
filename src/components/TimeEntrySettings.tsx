import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TaskType, Project, Client } from '@/types';
import { Edit3, Trash2, Plus } from 'lucide-react';
interface TimeEntrySettingsProps {
  highlightSection?: string | null;
}

export const TimeEntrySettings: React.FC<TimeEntrySettingsProps> = ({ highlightSection }) => {
  const {
    settings,
    updateSettings
  } = useApp();
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
      hourlyRate: newTaskRate ? parseFloat(newTaskRate) : undefined
    };
    updateSettings({
      taskTypes: [...settings.taskTypes, newTask]
    });
    setNewTaskName('');
    setNewTaskRate('');
  };
  const handleDeleteTask = (taskId: string) => {
    updateSettings({
      taskTypes: settings.taskTypes.filter(task => task.id !== taskId)
    });
  };
  const handleUpdateTask = (task: TaskType) => {
    updateSettings({
      taskTypes: settings.taskTypes.map(t => t.id === task.id ? task : t)
    });
    setEditingTask(null);
  };
  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim()
    };
    updateSettings({
      projects: [...settings.projects, newProject]
    });
    setNewProjectName('');
  };
  const handleDeleteProject = (projectId: string) => {
    updateSettings({
      projects: settings.projects.filter(project => project.id !== projectId)
    });
  };
  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    const newClient: Client = {
      id: Date.now().toString(),
      name: newClientName.trim()
    };
    updateSettings({
      clients: [...settings.clients, newClient]
    });
    setNewClientName('');
  };
  const handleDeleteClient = (clientId: string) => {
    updateSettings({
      clients: settings.clients.filter(client => client.id !== clientId)
    });
  };
  return <div>
      {/* Clients */}
      <section className="px-2.5">
        <div className="pt-1.5 mb-3">
          <h3 className="text-[#09121F] text-sm font-bold">Clients</h3>
        </div>
        <div className="border-b border-[#09121F] mb-3"></div>
        
        <div className="space-y-3">
          {settings.clients.map(client => <div key={client.id} className="flex items-center justify-between">
              {editingClient?.id === client.id ? (
                <input 
                  type="text" 
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                  onBlur={() => {
                    updateSettings({
                      clients: settings.clients.map(c => c.id === editingClient.id ? editingClient : c)
                    });
                    setEditingClient(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateSettings({
                        clients: settings.clients.map(c => c.id === editingClient.id ? editingClient : c)
                      });
                      setEditingClient(null);
                    }
                    if (e.key === 'Escape') {
                      setEditingClient(null);
                    }
                  }}
                  className="text-[#09121F] text-sm bg-transparent border-none outline-none flex-1"
                  style={{ marginRight: '56px' }}
                  autoFocus
                />
              ) : (
                <span className="text-[#09121F] text-sm" style={{ marginRight: '56px' }}>{client.name}</span>
              )}
              <div className="flex gap-3 w-[56px] justify-end">
                <button onClick={() => setEditingClient(client)} className="text-gray-400 hover:text-[#09121F]">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDeleteClient(client.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>)}
          
          <div className="flex items-center justify-between">
            <input type="text" placeholder="Add client" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1" />
            <button onClick={handleAddClient} className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
              <Plus className="h-2.5 w-2.5" strokeWidth={3} />
            </button>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="px-2.5">
        <div className="pt-5 mb-3">
          <h3 className="text-[#09121F] text-sm font-bold">Projects</h3>
        </div>
        <div className="border-b border-[#09121F] mb-3"></div>
        
        <div className="space-y-3">
          {settings.projects.map(project => <div key={project.id} className="flex items-center justify-between">
              {editingProject?.id === project.id ? (
                <input 
                  type="text" 
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                  onBlur={() => {
                    updateSettings({
                      projects: settings.projects.map(p => p.id === editingProject.id ? editingProject : p)
                    });
                    setEditingProject(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateSettings({
                        projects: settings.projects.map(p => p.id === editingProject.id ? editingProject : p)
                      });
                      setEditingProject(null);
                    }
                    if (e.key === 'Escape') {
                      setEditingProject(null);
                    }
                  }}
                  className="text-[#09121F] text-sm bg-transparent border-none outline-none flex-1"
                  style={{ marginRight: '56px' }}
                  autoFocus
                />
              ) : (
                <span className="text-[#09121F] text-sm" style={{ marginRight: '56px' }}>{project.name}</span>
              )}
              <div className="flex gap-3 w-[56px] justify-end">
                <button onClick={() => setEditingProject(project)} className="text-gray-400 hover:text-[#09121F]">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDeleteProject(project.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>)}
          
          <div className="flex items-center justify-between">
            <input type="text" placeholder="Add project" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1" />
            <button onClick={handleAddProject} className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
              <Plus className="h-2.5 w-2.5" strokeWidth={3} />
            </button>
          </div>
        </div>
      </section>

      {/* Tasks */}
      <section className="px-2.5">
        <div className="pt-5 mb-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[#09121F] text-sm font-bold">Tasks</h3>
            {settings.invoiceMode && <div className="flex items-center gap-3">
              <h3 className="text-[#09121F] text-sm font-bold min-w-[60px] text-right">Hourly Rate</h3>
              <div className="flex gap-3 pl-3 w-[56px]"></div>
            </div>}
          </div>
        </div>
        <div className="border-b border-[#09121F] mb-3"></div>
        
        <div className="space-y-3">
          {settings.taskTypes.map(task => <div key={task.id} className="flex items-center justify-between min-h-[20px]">
              <div className="flex-1 flex items-center">
                {editingTask?.id === task.id ? (
                  <input 
                    type="text" 
                    value={editingTask.name}
                    onChange={(e) => setEditingTask({...editingTask, name: e.target.value})}
                    onBlur={() => {
                      handleUpdateTask(editingTask);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateTask(editingTask);
                      }
                      if (e.key === 'Escape') {
                        setEditingTask(null);
                      }
                    }}
                    className="text-[#09121F] text-sm bg-transparent border-none outline-none flex-1 leading-5"
                    autoFocus
                  />
                ) : (
                  <span className="text-[#09121F] text-sm flex-1 leading-5">{task.name}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {settings.invoiceMode && (
                  <div className="min-w-[60px] text-right">
                    {editingTask?.id === task.id ? (
                      <input 
                        type="text" 
                        value={editingTask.hourlyRate?.toString() || ''}
                        onChange={(e) => setEditingTask({...editingTask, hourlyRate: parseFloat(e.target.value) || 0})}
                        onBlur={() => {
                          handleUpdateTask(editingTask);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateTask(editingTask);
                          }
                          if (e.key === 'Escape') {
                            setEditingTask(null);
                          }
                        }}
                        className="text-[#09121F] text-sm bg-transparent border-none outline-none w-full text-right leading-5"
                      />
                    ) : (
                      <span className="text-[#09121F] text-sm leading-5">
                        ${(task.hourlyRate || 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-3 w-[56px] justify-end">
                  <button onClick={() => setEditingTask(task)} className="text-gray-400 hover:text-[#09121F] flex items-center justify-center w-4 h-4">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500 flex items-center justify-center w-4 h-4">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>)}
          
          <div className="flex items-center justify-between">
            <input type="text" placeholder="Add task type" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1" />
            <div className="flex items-center gap-3">
              {settings.invoiceMode && <input type="text" placeholder="$0.00" value={newTaskRate} onChange={e => setNewTaskRate(e.target.value)} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none w-20 text-right" />}
              <div className="flex pl-8 justify-end w-[56px]">
                <button onClick={handleAddTask} className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Plus className="h-2.5 w-2.5" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};