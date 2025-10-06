import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeEntry } from '@/types';
import { format } from 'date-fns';
import { Trash2, Archive, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSelection } from '@/hooks/useSelection';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatHours } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Navigation, TabNavigation } from '@/components/Navigation';
import { Divider } from '@/components/Divider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { HomeIndicator } from '@/components/HomeIndicator';

export const TimeArchivePage: React.FC = () => {
  const {
    timeEntries,
    settings,
    viewMode,
    setViewMode,
    sortOption,
    setSortOption,
    updateSettings,
    updateTimeEntry,
    deleteTimeEntries
  } = useApp();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const selection = useSelection();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter archived entries
  const archivedEntries = timeEntries.filter(entry => entry.archived);
  const allArchivedIds = archivedEntries.map(entry => entry.id);

  // Get client by project
  const getClientByProject = (projectName: string) => {
    const project = settings.projects.find(p => p.name === projectName);
    if (project && project.clientId) {
      const client = settings.clients.find(c => c.id === project.clientId);
      return client?.name;
    }
    return null;
  };

  // Get task rate for invoice mode
  const getTaskRate = (task: string): number => {
    const taskType = settings.taskTypes.find(t => t.name.toLowerCase() === task.toLowerCase());
    return taskType?.hourlyRate || 0;
  };

  // Check if task has hourly rate set
  const hasTaskRate = (taskName: string): boolean => {
    const taskType = settings.taskTypes.find(t => t.name === taskName);
    return taskType?.hourlyRate !== undefined && taskType.hourlyRate > 0;
  };

  // Handle add rate click - navigate to settings and pre-populate task
  const handleAddRate = (taskName: string) => {
    // Check if task already exists, if not, add it
    const existingTask = settings.taskTypes.find(t => t.name === taskName);
    if (!existingTask) {
      const newTask = {
        id: Date.now().toString(),
        name: taskName,
        hourlyRate: 0
      };
      updateSettings({
        taskTypes: [...settings.taskTypes, newTask]
      });
    }
    // Store the task name for settings page to highlight
    localStorage.setItem('newTaskToEdit', taskName);
    // Navigate to main page which will show settings tab
    navigate('/?tab=settings');
  };

  // Calculate fee for invoice mode
  const calculateFee = (entry: TimeEntry): number => {
    if (viewMode !== 'invoice') return 0;
    const rate = getTaskRate(entry.task);
    return entry.duration * rate;
  };

  // Group and sort archived entries based on sort option - matching TimeTally structure
  const organizedData = useMemo(() => {
    if (archivedEntries.length === 0) return {
      groups: [],
      total: {
        hours: 0,
        fee: 0
      }
    };
    
    let groups: any[] = [];
    let totalHours = 0;
    let totalFee = 0;
    
    archivedEntries.forEach(entry => {
      totalHours += entry.duration;
      totalFee += calculateFee(entry);
    });
    
    if (sortOption === 'project') {
      // Group by Client > Project (matching TimeTally)
      const clientGroups: { [key: string]: { [key: string]: TimeEntry[] } } = {};
      
      archivedEntries.forEach(entry => {
        const clientName = entry.client || getClientByProject(entry.project) || 'No Client';
        const projectName = entry.project;
        
        if (!clientGroups[clientName]) clientGroups[clientName] = {};
        if (!clientGroups[clientName][projectName]) clientGroups[clientName][projectName] = [];
        clientGroups[clientName][projectName].push(entry);
      });
      
      groups = Object.entries(clientGroups).map(([clientName, projects]) => ({
        type: 'client',
        name: clientName,
        subgroups: Object.entries(projects).map(([projectName, entries]) => ({
          type: 'project',
          name: projectName,
          entries: entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
          subtotal: {
            hours: entries.reduce((sum, e) => sum + e.duration, 0),
            fee: entries.reduce((sum, e) => sum + calculateFee(e), 0)
          }
        }))
      }));
    } else if (sortOption === 'date') {
      // Group by Date > Project (matching TimeTally)
      const dateGroups: { [key: string]: { [key: string]: TimeEntry[] } } = {};
      
      archivedEntries.forEach(entry => {
        const dateKey = format(new Date(entry.date), 'MM/dd/yyyy');
        const projectKey = entry.project;
        
        if (!dateGroups[dateKey]) dateGroups[dateKey] = {};
        if (!dateGroups[dateKey][projectKey]) dateGroups[dateKey][projectKey] = [];
        dateGroups[dateKey][projectKey].push(entry);
      });
      
      groups = Object.entries(dateGroups)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, projects]) => ({
          type: 'date',
          name: date,
          subgroups: Object.entries(projects).map(([projectName, entries]) => ({
            type: 'project',
            name: projectName,
            entries: entries,
            subtotal: {
              hours: entries.reduce((sum, e) => sum + e.duration, 0),
              fee: entries.reduce((sum, e) => sum + calculateFee(e), 0)
            }
          })),
          subtotal: {
            hours: Object.values(projects).flat().reduce((sum, e) => sum + e.duration, 0),
            fee: Object.values(projects).flat().reduce((sum, e) => sum + calculateFee(e), 0)
          }
        }));
    } else if (sortOption === 'task') {
      // Group by Task > Project (matching TimeTally)
      const taskGroups: { [key: string]: { [key: string]: TimeEntry[] } } = {};
      
      archivedEntries.forEach(entry => {
        const taskName = entry.task;
        const projectName = entry.project;
        
        if (!taskGroups[taskName]) taskGroups[taskName] = {};
        if (!taskGroups[taskName][projectName]) taskGroups[taskName][projectName] = [];
        taskGroups[taskName][projectName].push(entry);
      });
      
      groups = Object.entries(taskGroups).map(([taskName, projects]) => ({
        type: 'task',
        name: taskName,
        subgroups: Object.entries(projects).map(([projectName, entries]) => ({
          type: 'project',
          name: projectName,
          entries: entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
          subtotal: {
            hours: entries.reduce((sum, e) => sum + e.duration, 0),
            fee: entries.reduce((sum, e) => sum + calculateFee(e), 0)
          }
        })),
        subtotal: {
          hours: Object.values(projects).flat().reduce((sum, e) => sum + e.duration, 0),
          fee: Object.values(projects).flat().reduce((sum, e) => sum + calculateFee(e), 0)
        }
      }));
    }
    
    return {
      groups,
      total: {
        hours: totalHours,
        fee: totalFee
      }
    };
  }, [archivedEntries, sortOption, viewMode, settings]);

  const handleRestore = async (ids: string[]) => {
    try {
      // Update each entry to unarchive it
      for (const id of ids) {
        await updateTimeEntry(id, { archived: false });
      }
      
      selection.clearSelection();
      
      toast({
        title: ids.length === 1 ? "Time entry restored." : `${ids.length} entries restored.`
      });
    } catch (error) {
      console.error('Error restoring entries:', error);
      toast({
        description: "Error restoring entries. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteTimeEntries(ids);
      
      selection.clearSelection();
      setShowDeleteDialog(false);
      
      toast({
        title: ids.length === 1 ? "Time entry deleted." : `${ids.length} entries deleted.`
      });
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast({
        description: "Error deleting entries. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClearArchive = async () => {
    try {
      const archivedIds = archivedEntries.map(e => e.id);
      await deleteTimeEntries(archivedIds);
      
      selection.clearSelection();
      setShowClearDialog(false);
      
      toast({
        title: "Archive cleared.",
        description: "All archived entries have been permanently deleted"
      });
    } catch (error) {
      console.error('Error clearing archive:', error);
      toast({
        description: "Error clearing archive. Please try again.",
        variant: "destructive"
      });
    }
  };


  // Get sort option display text
  const getSortOptionText = () => {
    switch (sortOption) {
      case 'project':
        return 'By Project';
      case 'date':
        return 'By Date';
      case 'task':
        return 'By Task';
      default:
        return 'By Date';
    }
  };

  // Get table headers based on sort option - matching TimeTally
  const getTableHeaders = () => {
    if (sortOption === 'project') {
      return settings.invoiceMode ? ['Date', 'Task', 'Hours', 'Fee'] : ['Date', 'Task', 'Hours'];
    } else if (sortOption === 'date') {
      return settings.invoiceMode ? ['Project', 'Task', 'Hours', 'Fee'] : ['Project', 'Task', 'Hours'];
    } else {
      // task
      return settings.invoiceMode ? ['Date', 'Project', 'Hours', 'Fee'] : ['Date', 'Project', 'Hours'];
    }
  };
  const headers = getTableHeaders();
  
  // Get grid template matching TimeTally
  const getEntryGridTemplate = (invoiceMode: boolean) => {
    const hasDateColumn = sortOption === 'project' || sortOption === 'task';
    if (hasDateColumn) {
      return invoiceMode
        ? '16px 8px 0.5fr 8px 1.5fr 8px 50px 8px 60px'
        : '16px 8px 0.5fr 8px 1.5fr 8px 50px';
    } else {
      return invoiceMode
        ? '16px 8px 1fr 8px 1fr 8px 50px 8px 60px'
        : '16px 8px 1fr 8px 1fr 8px 50px';
    }
  };

  const isAllSelected = allArchivedIds.length > 0 && allArchivedIds.every(id => selection.isSelected(id));
  
  // Selection helpers for groups
  const getGroupEntryIds = (group: any): string[] => {
    const ids: string[] = [];
    if (group.subgroups) {
      group.subgroups.forEach((subgroup: any) => {
        if (subgroup.entries) {
          ids.push(...subgroup.entries.map((entry: TimeEntry) => entry.id));
        }
      });
    }
    return ids;
  };
  
  const isGroupSelected = (group: any): boolean => {
    const ids = getGroupEntryIds(group);
    return ids.length > 0 && ids.every(id => selection.isSelected(id));
  };
  
  const toggleGroupSelection = (group: any) => {
    const ids = getGroupEntryIds(group);
    selection.toggleSelectAll(ids);
  };
  
  const getSubgroupEntryIds = (subgroup: any): string[] => {
    if (subgroup.entries) {
      return subgroup.entries.map((entry: TimeEntry) => entry.id);
    }
    return [];
  };
  
  const isSubgroupSelected = (subgroup: any): boolean => {
    const ids = getSubgroupEntryIds(subgroup);
    return ids.length > 0 && ids.every(id => selection.isSelected(id));
  };
  
  const toggleSubgroupSelection = (subgroup: any) => {
    const ids = getSubgroupEntryIds(subgroup);
    selection.toggleSelectAll(ids);
  };
  
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gilroy:wght@400;700;800;900&display=swap"
      />
      <div className="fixed inset-0 flex flex-col bg-white" style={{ fontFamily: 'Gilroy, sans-serif' }}>
        <div className="sticky top-0 z-40 bg-white" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="w-full max-w-sm mx-auto px-2.5">
            <Navigation activeTab="" onTabChange={() => {}} />
            <TabNavigation activeTab="" onTabChange={() => {}} />
            <Divider />
          </div>
          <div className="h-1" />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-stable">
          <div className="w-full max-w-sm mx-auto px-2.5">
            {/* Mode Toggle */}
            <div className="flex justify-center items-center w-full px-2.5 py-4">
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${!settings.invoiceMode ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
                Time Card Mode
              </span>
              <button onClick={() => updateSettings({ invoiceMode: !settings.invoiceMode })} className={`w-12 h-6 rounded-full transition-colors ${settings.invoiceMode ? 'bg-[#09121F]' : 'bg-[#BFBFBF]'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.invoiceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm font-medium ${settings.invoiceMode ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
                Invoice Mode
              </span>
            </div>
            </div>

            {/* Divider */}
            <div className="w-full px-2.5 mb-6"><div className="h-px bg-[#09121F]" /></div>

            <div className="flex flex-col h-full w-full font-gilroy">
          {/* Header / Selection Toolbar */}
          <div className="pt-0.5 pb-1 h-[2.75rem] px-2.5">
            <div className="flex items-baseline justify-between h-full">
              <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Time Archive</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center text-sm font-medium text-[#09121F] hover:bg-gray-50">
                    {getSortOptionText()}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-none shadow-lg z-50">
                  <DropdownMenuItem onClick={() => setSortOption('project')} className="text-sm font-medium text-[#09121F] hover:bg-gray-50 cursor-pointer">
                    By Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('date')} className="text-sm font-medium text-[#09121F] hover:bg-gray-50 cursor-pointer">
                    By Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption('task')} className="text-sm font-medium text-[#09121F] hover:bg-gray-50 cursor-pointer">
                    By Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Table Header */}
          <div className="w-full px-2.5">
            <div className="grid h-[32px] items-center" style={{
              gridTemplateColumns: getEntryGridTemplate(settings.invoiceMode),
              gap: '0'
            }}>
              <div className="flex items-center justify-start">
                <div className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${isAllSelected ? 'bg-gray-300' : 'bg-white'}`} onClick={() => selection.toggleSelectAll(allArchivedIds)}>
                  {isAllSelected && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
                </div>
              </div>
              <div></div>
              {headers.map((header, index) => (
                <React.Fragment key={header}>
                  <span className={`text-[#09121F] text-sm font-bold ${header === 'Fee' ? 'text-right' : header === 'Hours' ? 'text-left' : 'text-left'}`}>
                    {header}
                  </span>
                  {index < headers.length - 1 && <div></div>}
                </React.Fragment>
              ))}
            </div>
            <div className="h-px bg-[#09121F]" />
          </div>

          {/* Content */}
          <div className="w-full px-2.5">
            {archivedEntries.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="h-12 w-12 mx-auto mb-2 opacity-50 text-[#BFBFBF]" />
                <p className="text-[#BFBFBF] text-lg">No archived entries</p>
              </div>
            ) : (
              <div className="space-y-0">
                {organizedData.groups.map((group, groupIndex) => (
                  <div key={`${group.type}-${group.name}-${groupIndex}`}>
                    
                    {/* Top Level Header */}
                    <div className="grid items-center font-bold text-[#09121F] text-sm py-2" style={{
                      gridTemplateColumns: getEntryGridTemplate(settings.invoiceMode),
                      gap: '0'
                    }}>
                      <div className="flex items-center justify-start">
                        {(() => {
                          const isSelected = isGroupSelected(group);
                          return (
                            <div 
                              className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${isSelected ? 'bg-gray-300' : 'bg-white'}`}
                              onClick={() => toggleGroupSelection(group)}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
                            </div>
                          );
                        })()}
                      </div>
                      <div></div>
                      <div className="text-left font-bold text-[#09121F] text-sm col-span-3">
                        {sortOption === 'date' ? format(new Date(group.name), 'MM/dd/yy') : group.name}
                      </div>
                      <div></div>
                      <div></div>
                      {settings.invoiceMode && (
                        <>
                          <div></div>
                          <div></div>
                        </>
                      )}
                    </div>

                    {/* Subgroups */}
                    {group.subgroups?.map((subgroup: any, subIndex: number) => (
                      <div key={`${subgroup.type}-${subgroup.name}-${subIndex}`}>
                        
                        {/* Subgroup Header */}
                        <div className="grid items-center font-bold text-[#09121F] text-sm py-2" style={{
                          gridTemplateColumns: getEntryGridTemplate(settings.invoiceMode),
                          gap: '0'
                        }}>
                          <div className="flex items-center justify-start">
                            {sortOption === 'project' ? (
                              (() => {
                                const isSelected = isSubgroupSelected(subgroup);
                                return (
                                  <div 
                                    className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${isSelected ? 'bg-gray-300' : 'bg-white'}`}
                                    onClick={() => toggleSubgroupSelection(subgroup)}
                                  >
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="w-4 h-4"></div>
                            )}
                          </div>
                          <div></div>
                          <div className="text-left font-bold text-[#09121F] text-sm col-span-3">
                            {subgroup.name}
                          </div>
                          <div></div>
                          <div></div>
                          {settings.invoiceMode && (
                            <>
                              <div></div>
                              <div></div>
                            </>
                          )}
                        </div>

                        {/* Entries */}
                        {subgroup.entries?.map((entry: TimeEntry) => (
                          <div key={entry.id} className="grid items-start hover:bg-gray-50 py-2" style={{
                            gridTemplateColumns: getEntryGridTemplate(settings.invoiceMode),
                            gap: '0'
                          }}>
                            <div className="flex items-start justify-start self-start mt-1">
                              <div className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${selection.isSelected(entry.id) ? 'bg-gray-300' : 'bg-white'}`} onClick={() => selection.toggleSelectRecord(entry.id)} style={{
                                marginTop: '-3px'
                              }}>
                                {selection.isSelected(entry.id) && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
                              </div>
                            </div>
                            
                            <div></div>
                            
                            {/* Entry data based on sort option */}
                            {sortOption === 'project' && (
                              <React.Fragment>
                                <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                  {format(new Date(entry.date), 'MM/dd')}
                                </div>
                                <div></div>
                                <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                  {entry.task}
                                </div>
                                <div></div>
                                 <div className="text-[#09121F] text-sm leading-tight text-left flex items-start justify-start">
                                   {formatHours(entry.duration)}
                                 </div>
                                {settings.invoiceMode && (
                                    <>
                                      <div></div>
                                      <div className="text-[#09121F] text-sm leading-tight text-right flex items-start justify-end">
                                        {hasTaskRate(entry.task) ? (
                                          formatCurrency(calculateFee(entry))
                                        ) : (
                                          <button 
                                            onClick={() => handleAddRate(entry.task)}
                                            className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-[#09121F]/80 transition-colors"
                                          >
                                            <Plus className="h-2.5 w-2.5" />
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                              </React.Fragment>
                            )}
                            
                            {sortOption === 'date' && (
                              <React.Fragment>
                                <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                  {entry.project}
                                </div>
                                <div></div>
                                <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                  {entry.task}
                                </div>
                                <div></div>
                                 <div className="text-[#09121F] text-sm leading-tight text-left flex items-start justify-start">
                                   {formatHours(entry.duration)}
                                 </div>
                                  {settings.invoiceMode && (
                                    <>
                                      <div></div>
                                      <div className="text-[#09121F] text-sm leading-tight text-right flex items-start justify-end">
                                        {hasTaskRate(entry.task) ? (
                                          formatCurrency(calculateFee(entry))
                                        ) : (
                                          <button 
                                            onClick={() => handleAddRate(entry.task)}
                                            className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-[#09121F]/80 transition-colors"
                                          >
                                            <Plus className="h-2.5 w-2.5" />
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                              </React.Fragment>
                            )}
                            
                            {sortOption === 'task' && (
                              <React.Fragment>
                                <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                  {format(new Date(entry.date), 'MM/dd')}
                                </div>
                                <div></div>
                                <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                  {entry.project}
                                </div>
                                <div></div>
                                 <div className="text-[#09121F] text-sm leading-tight text-left flex items-start justify-start">
                                   {formatHours(entry.duration)}
                                 </div>
                                  {settings.invoiceMode && (
                                    <>
                                      <div></div>
                                      <div className="text-[#09121F] text-sm leading-tight text-right flex items-start justify-end">
                                        {hasTaskRate(entry.task) ? (
                                          formatCurrency(calculateFee(entry))
                                        ) : (
                                          <button 
                                            onClick={() => handleAddRate(entry.task)}
                                            className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-[#09121F]/80 transition-colors"
                                          >
                                            <Plus className="h-2.5 w-2.5" />
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                              </React.Fragment>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full px-2.5 py-5 space-y-3">
            <div className="flex gap-3">
              <button 
                onClick={() => handleRestore(selection.selectedIds)} 
                className="flex-1 bg-white border border-[#09121F] text-[#09121F] py-3.5 font-bold text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selection.hasAnySelected}
              >
                Unarchive
              </button>
              <button 
                onClick={() => setShowDeleteDialog(true)} 
                className="flex-1 bg-white border border-[#09121F] text-[#09121F] py-3.5 font-bold text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selection.hasAnySelected}
              >
                Delete
              </button>
            </div>
            
            <button 
              onClick={() => navigate('/')} 
              className="w-full text-white py-3.5 font-bold text-sm transition-colors"
              style={{
                backgroundColor: '#09121F'
              }}
            >
              Exit
            </button>
          </div>

          {/* Clear Archive Dialog */}
          <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                
                <AlertDialogDescription>
                  This will permanently delete all {archivedEntries.length} archived entries. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearArchive}>
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Selected Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Selected Entries</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {selection.selectedCount} selected entries. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                handleDelete(selection.selectedIds);
                setShowDeleteDialog(false);
              }}>
                  Delete Selected
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
            </div>
          </div>
        </div>

        <HomeIndicator />
      </div>
    </>
  );
};