import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { TaskType, TaxType, Project, Client } from '@/types';
import { Edit3, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
interface TimeEntrySettingsProps {
  highlightSection?: string | null;
}
export const TimeEntrySettings: React.FC<TimeEntrySettingsProps> = ({
  highlightSection
}) => {
  const navigate = useNavigate();
  const {
    settings,
    updateSettings
  } = useApp();
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [editingTax, setEditingTax] = useState<TaxType | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskRate, setNewTaskRate] = useState('');
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    const newTask: TaskType = {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      hourlyRate: newTaskRate ? parseFloat(newTaskRate.replace(/[^0-9.]/g, '')) : undefined
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
  const handleAddTax = () => {
    if (!newTaxName.trim()) return;
    const newTax: TaxType = {
      id: Date.now().toString(),
      name: newTaxName.trim(),
      rate: newTaxRate ? parseFloat(newTaxRate.replace(/[^0-9.]/g, '')) : undefined
    };
    updateSettings({
      taxTypes: [...(settings.taxTypes || []), newTax]
    });
    setNewTaxName('');
    setNewTaxRate('');
  };
  const handleDeleteTax = (taxId: string) => {
    updateSettings({
      taxTypes: (settings.taxTypes || []).filter(tax => tax.id !== taxId)
    });
  };
  const handleUpdateTax = (tax: TaxType) => {
    updateSettings({
      taxTypes: (settings.taxTypes || []).map(t => t.id === tax.id ? tax : t)
    });
    setEditingTax(null);
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
              {editingClient?.id === client.id ? <input type="text" value={editingClient.name} onChange={e => setEditingClient({
            ...editingClient,
            name: e.target.value
          })} onBlur={() => {
            updateSettings({
              clients: settings.clients.map(c => c.id === editingClient.id ? editingClient : c)
            });
            setEditingClient(null);
          }} onKeyDown={e => {
            if (e.key === 'Enter') {
              updateSettings({
                clients: settings.clients.map(c => c.id === editingClient.id ? editingClient : c)
              });
              setEditingClient(null);
            }
            if (e.key === 'Escape') {
              setEditingClient(null);
            }
          }} className="text-[#09121F] text-sm bg-transparent border-none outline-none flex-1 min-w-0" autoFocus /> : <span className="text-[#09121F] text-sm flex-1 min-w-0">{client.name}</span>}
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(`/client-address?clientId=${client.id}`)} className="text-[#BFBFBF] text-right text-[15px] font-normal leading-5 underline decoration-solid decoration-auto underline-offset-auto">
                  +/Edit Address
                </button>
                <button onClick={() => setEditingClient(client)} className="text-gray-400 hover:text-[#09121F]">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDeleteClient(client.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>)}
          
          <div className="flex items-center justify-between">
            <input type="text" placeholder="Add client" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1 min-w-0" />
            <button onClick={handleAddClient} className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-[#09121F]/80 transition-colors">
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
              {editingProject?.id === project.id ? <input type="text" value={editingProject.name} onChange={e => setEditingProject({
            ...editingProject,
            name: e.target.value
          })} onBlur={() => {
            updateSettings({
              projects: settings.projects.map(p => p.id === editingProject.id ? editingProject : p)
            });
            setEditingProject(null);
          }} onKeyDown={e => {
            if (e.key === 'Enter') {
              updateSettings({
                projects: settings.projects.map(p => p.id === editingProject.id ? editingProject : p)
              });
              setEditingProject(null);
            }
            if (e.key === 'Escape') {
              setEditingProject(null);
            }
          }} className="text-[#09121F] text-sm bg-transparent border-none outline-none flex-1 min-w-0" style={{
            marginRight: '56px'
          }} autoFocus /> : <span className="text-[#09121F] text-sm" style={{
            marginRight: '56px'
          }}>{project.name}</span>}
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
            <input type="text" placeholder="Add project" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1 min-w-0" />
            <button onClick={handleAddProject} className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-[#09121F]/80 transition-colors">
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
              <div className="flex-1 min-w-0 flex items-center">
{editingTask?.id === task.id ? <input type="text" value={editingTask.name} onChange={e => setEditingTask({
              ...editingTask,
              name: e.target.value
            })} onKeyDown={e => {
              if (e.key === 'Enter') {
                handleUpdateTask(editingTask);
              }
              if (e.key === 'Escape') {
                setEditingTask(null);
              }
            }} className="text-[#09121F] text-sm bg-transparent border-none outline-none flex-1 min-w-0 leading-5" autoFocus /> : <span className="text-[#09121F] text-sm flex-1 min-w-0 leading-5">{task.name}</span>}
              </div>
              <div className="flex items-center gap-3">
                {settings.invoiceMode && <div className="min-w-[60px] text-right">
{editingTask?.id === task.id ? <input type="text" value={editingTask.hourlyRate?.toString() || ''} onChange={e => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setEditingTask({
                  ...editingTask,
                  hourlyRate: parseFloat(value) || 0
                });
              }} onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleUpdateTask(editingTask);
                }
                if (e.key === 'Escape') {
                  setEditingTask(null);
                }
              }} className="text-[#09121F] text-sm bg-transparent border-none outline-none w-full text-right leading-5" onFocus={e => e.target.select()} /> : <span className="text-[#09121F] text-sm leading-5">
                        {formatCurrency(task.hourlyRate || 0)}
                      </span>}
                  </div>}
                <div className="flex gap-3 w-[56px] justify-end">
                  <button onClick={() => {
                    console.log('Edit clicked for task:', task);
                    setEditingTask(task);
                  }} className="text-gray-400 hover:text-[#09121F] flex items-center justify-center w-4 h-4">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500 flex items-center justify-center w-4 h-4">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>)}
          
          <div className="flex items-center justify-between">
            <input type="text" placeholder="Add task type" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1 min-w-0" />
            <div className="flex items-center gap-3">
              {settings.invoiceMode && <input type="text" placeholder="$0.00" value={newTaskRate ? `$${newTaskRate}` : ''} onChange={e => {
              const input = e.target.value;
              // Remove all non-numeric characters except decimal point
              const numericValue = input.replace(/[^0-9.]/g, '');

              // Ensure only one decimal point
              const parts = numericValue.split('.');
              const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;

              // Limit to 2 decimal places
              const finalValue = formattedValue.includes('.') ? formattedValue.substring(0, formattedValue.indexOf('.') + 3) : formattedValue;
              setNewTaskRate(finalValue);
            }} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none w-20 text-right" />}
              <div className="flex pl-8 justify-end w-[56px]">
                <button onClick={handleAddTask} className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-[#09121F]/80 transition-colors">
                  <Plus className="h-2.5 w-2.5" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tax */}
      <section className="px-2.5 pb-[22px]">
        <div className="pt-5 mb-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[#09121F] text-sm font-bold">Tax</h3>
            {settings.invoiceMode && <div className="flex items-center gap-3">
              <h3 className="text-[#09121F] text-sm font-bold min-w-[60px] text-right">Rate</h3>
              <div className="flex gap-3 pl-3 w-[56px]"></div>
            </div>}
          </div>
        </div>
        <div className="border-b border-[#09121F] mb-3"></div>
        
        <div className="space-y-3">
          {(settings.taxTypes || []).map(tax => <div key={tax.id} className="flex items-center justify-between min-h-[20px]">
              <div className="flex-1 min-w-0 flex items-center">
{editingTax?.id === tax.id ? <input type="text" value={editingTax.name} onChange={e => setEditingTax({
              ...editingTax,
              name: e.target.value
            })} onKeyDown={e => {
              if (e.key === 'Enter') {
                handleUpdateTax(editingTax);
              }
              if (e.key === 'Escape') {
                setEditingTax(null);
              }
            }} className="text-[#09121F] text-sm bg-transparent border-none outline-none flex-1 min-w-0 leading-5" autoFocus /> : <span className="text-[#09121F] text-sm flex-1 min-w-0 leading-5">{tax.name}</span>}
              </div>
              <div className="flex items-center gap-3">
                {settings.invoiceMode && <div className="min-w-[60px] text-right">
{editingTax?.id === tax.id ? <input type="text" value={editingTax.rate?.toString() || ''} onChange={e => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                setEditingTax({
                  ...editingTax,
                  rate: parseFloat(value) || 0
                });
              }} onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleUpdateTax(editingTax);
                }
                if (e.key === 'Escape') {
                  setEditingTax(null);
                }
              }} className="text-[#09121F] text-sm bg-transparent border-none outline-none w-full text-right leading-5" onFocus={e => e.target.select()} /> : <span className="text-[#09121F] text-sm leading-5">
                        {tax.rate ? `${tax.rate}%` : '0.00%'}
                      </span>}
                  </div>}
                <div className="flex gap-3 w-[56px] justify-end">
                  <button onClick={() => {
                    console.log('Edit clicked for tax:', tax);
                    setEditingTax(tax);
                  }} className="text-gray-400 hover:text-[#09121F] flex items-center justify-center w-4 h-4">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDeleteTax(tax.id)} className="text-gray-400 hover:text-red-500 flex items-center justify-center w-4 h-4">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>)}
          
          <div className="flex items-center justify-between">
            <input type="text" placeholder="Add tax type" value={newTaxName} onChange={e => setNewTaxName(e.target.value)} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none flex-1 min-w-0" />
            <div className="flex items-center gap-3">
              {settings.invoiceMode && <input type="text" placeholder="0.00%" value={newTaxRate ? `${newTaxRate}%` : ''} onChange={e => {
              const input = e.target.value;
              // Remove all non-numeric characters except decimal point
              const numericValue = input.replace(/[^0-9.]/g, '');

              // Ensure only one decimal point
              const parts = numericValue.split('.');
              const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;

              // Limit to 2 decimal places
              const finalValue = formattedValue.includes('.') ? formattedValue.substring(0, formattedValue.indexOf('.') + 3) : formattedValue;
              setNewTaxRate(finalValue);
            }} className="text-[#BFBFBF] text-sm bg-transparent border-none outline-none w-20 text-right" />}
              <div className="flex pl-8 justify-end w-[56px]">
                <button onClick={handleAddTax} className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-[#09121F]/80 transition-colors">
                  <Plus className="h-2.5 w-2.5" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};