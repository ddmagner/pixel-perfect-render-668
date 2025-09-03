import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeEntry } from '@/types';
import { format } from 'date-fns';
import { ChevronDown, Pencil, Trash2, Archive, Edit, X, Plus, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ExportDialog } from '@/components/ExportDialog';
import { EditTimeEntryDialog } from '@/components/EditTimeEntryDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useSelection } from '@/hooks/useSelection';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
interface TimeTallyProps {
  onSwitchToSettings?: () => void;
}
export const TimeTally: React.FC<TimeTallyProps> = ({
  onSwitchToSettings
}) => {
  const {
    timeEntries,
    sortOption,
    setSortOption,
    settings,
    deleteTimeEntries,
    archiveTimeEntries,
    updateSettings
  } = useApp();
  const navigate = useNavigate();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const selection = useSelection();
  const {
    toast
  } = useToast();

  // Filter out archived entries
  const activeTimeEntries = timeEntries.filter(entry => !entry.archived);

  // Format hours as decimal
  const formatHours = (hours: number): string => {
    return hours.toFixed(2);
  };

  // Get client name by project
  const getClientByProject = (projectName: string): string => {
    const project = settings.projects.find(p => p.name === projectName);
    if (project?.clientId) {
      const client = settings.clients.find(c => c.id === project.clientId);
      return client?.name || '';
    }
    return '';
  };

  // Get task rate for invoice mode
  const getTaskRate = (taskName: string): number => {
    const taskType = settings.taskTypes.find(t => t.name === taskName);
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
    // Switch to settings tab
    if (onSwitchToSettings) {
      onSwitchToSettings();
    }
  };

  // Calculate fee for an entry
  const calculateFee = (entry: TimeEntry): number => {
    if (!settings.invoiceMode) return 0;
    return entry.duration * getTaskRate(entry.task);
  };

  // Group and sort entries based on sort option
  const organizedData = useMemo(() => {
    if (activeTimeEntries.length === 0) return {
      groups: [],
      total: {
        hours: 0,
        fee: 0
      }
    };
    
    let totalHours = 0;
    let totalFee = 0;
    activeTimeEntries.forEach(entry => {
      totalHours += entry.duration;
      totalFee += calculateFee(entry);
    });

    // Always group by client first, then sort by the selected option within each client
    const clientGroups: { [key: string]: TimeEntry[] } = {};
    
    activeTimeEntries.forEach(entry => {
      const clientName = getClientByProject(entry.project) || 'No Client';
      if (!clientGroups[clientName]) clientGroups[clientName] = [];
      clientGroups[clientName].push(entry);
    });

    const groups = Object.entries(clientGroups).map(([clientName, entries]) => {
      let sortedEntries = [...entries];
      
      if (sortOption === 'project') {
        sortedEntries.sort((a, b) => {
          if (a.project !== b.project) return a.project.localeCompare(b.project);
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
      } else if (sortOption === 'date') {
        sortedEntries.sort((a, b) => {
          if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
          if (a.project !== b.project) return a.project.localeCompare(b.project);
          return a.task.localeCompare(b.task);
        });
      } else if (sortOption === 'task') {
        sortedEntries.sort((a, b) => {
          if (a.task !== b.task) return a.task.localeCompare(b.task);
          if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
          return a.project.localeCompare(b.project);
        });
      }

      return {
        type: 'client',
        name: clientName,
        entries: sortedEntries,
        subtotal: {
          hours: entries.reduce((sum, e) => sum + e.duration, 0),
          fee: entries.reduce((sum, e) => sum + calculateFee(e), 0)
        }
      };
    });

    return {
      groups,
      total: {
        hours: totalHours,
        fee: totalFee
      }
    };
  }, [activeTimeEntries, sortOption, settings]);

  // Get all entry IDs for selection
  const allEntryIds = useMemo(() => {
    const ids: string[] = [];
    organizedData.groups.forEach(group => {
      if (group.entries) {
        group.entries.forEach((entry: TimeEntry) => ids.push(entry.id));
      }
    });
    return ids;
  }, [organizedData]);
  const handleEdit = () => {
    if (selection.selectedCount === 1) {
      const entryId = selection.selectedIds[0];
      const entry = activeTimeEntries.find(e => e.id === entryId);
      if (entry) {
        setEditingEntry(entry);
      }
    }
  };
  const handleDelete = () => {
    deleteTimeEntries(selection.selectedIds);
    selection.clearSelection();
    setShowDeleteDialog(false);
    toast({
      title: "Entries Deleted",
      description: `${selection.selectedCount} ${selection.selectedCount === 1 ? 'entry' : 'entries'} deleted`
    });
  };
  const handleArchive = () => {
    archiveTimeEntries(selection.selectedIds);
    selection.clearSelection();
    setShowArchiveDialog(false);
    toast({
      title: "Entries Archived",
      description: `${selection.selectedCount} ${selection.selectedCount === 1 ? 'entry' : 'entries'} moved to archive`
    });
  };
  const handleExport = () => {
    setIsExportDialogOpen(true);
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
        return 'By Project';
    }
  };

  // Get table headers based on sort option
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
  const gridCols = settings.invoiceMode ? 'grid-cols-4' : 'grid-cols-3';
  const gridColsWithSelection = settings.invoiceMode ? 'grid-cols-5' : 'grid-cols-4';
  const isAllSelected = allEntryIds.length > 0 && allEntryIds.every(id => selection.isSelected(id));
  return <div className="flex flex-col h-full w-full font-gilroy">
      {/* Divider */}

      {/* Header / Selection Toolbar */}
      <div className="pt-0.5 pb-1 h-[2.75rem] px-2.5 mb-6">
        {selection.hasAnySelected && <div className="fixed left-1/2 transform -translate-x-1/2 w-[calc(100%-1.25rem)] z-50" style={{
        top: '170px'
      }}>
            <div className="flex items-center gap-2 bg-gray-50 h-[2.75rem] py-2 pl-0 pr-3 justify-between rounded" style={{
          boxShadow: '0 -3px 8px -1px rgba(0, 0, 0, 0.2), 0 3px 8px -1px rgba(0, 0, 0, 0.2)'
        }}>
              <div className="flex items-center gap-2" style={{
            paddingLeft: '32px'
          }}>
                <Button size="sm" variant="ghost" onClick={handleEdit} disabled={selection.selectedCount !== 1} className="bg-transparent text-[#09121F] hover:text-gray-600 hover:bg-transparent border-none shadow-none pl-0 gap-1 text-xs">
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
                
                <Button size="sm" variant="ghost" onClick={() => setShowDeleteDialog(true)} className="bg-transparent text-[#09121F] hover:text-gray-600 hover:bg-transparent border-none shadow-none gap-1 text-xs">
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
                
                <Button size="sm" variant="ghost" onClick={() => setShowArchiveDialog(true)} className="bg-transparent text-[#09121F] hover:text-gray-600 hover:bg-transparent border-none shadow-none gap-1 text-xs">
                  <Archive className="h-3 w-3" />
                  Archive
                </Button>
              </div>

              <Button size="sm" variant="ghost" onClick={selection.clearSelection} className="bg-transparent text-[#09121F] hover:text-gray-600 hover:bg-transparent border-none shadow-none p-1">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>}
        
        <div className="flex items-baseline justify-between h-full py-[20px]">
          <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Where the time went</h1>
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
        <div className={`grid ${gridColsWithSelection} h-[32px] items-center`} style={{
        gridTemplateColumns: '32px minmax(0, 1fr) minmax(0, 1fr) 40px' + (settings.invoiceMode ? ' calc(40px + 50px)' : ''),
        gap: '0'
      }}>
          <div className="flex items-center w-[32px]">
            <div className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${isAllSelected ? 'bg-gray-300' : 'bg-white'}`} onClick={() => selection.toggleSelectAll(allEntryIds)}>
              {isAllSelected && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
            </div>
          </div>
          {headers.map((header, index) => <span key={header} className={`text-[#09121F] text-sm font-bold ${header === 'Hours' || header === 'Fee' ? 'text-right' : 'text-left'}`}>
              {header}
            </span>)}
        </div>
        <div className="h-px bg-[#09121F]" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full px-2.5">
        {organizedData.groups.length === 0 ? <div className="text-center py-8">
            <p className="text-[#BFBFBF] text-lg">No time entered yet. Get busy.</p>
          </div> : <>
            <div className="space-y-0">
              {organizedData.groups.map((group, groupIndex) => (
                <div key={`${group.type}-${group.name}-${groupIndex}`}>
                  {/* Client Header - Left Aligned */}
                  <div className={`grid ${gridColsWithSelection} h-[32px] items-center font-bold text-[#09121F] text-sm`} style={{
                    gridTemplateColumns: '32px minmax(0, 1fr) minmax(0, 1fr) 40px' + (settings.invoiceMode ? ' calc(40px + 50px)' : ''),
                    gap: '0'
                  }}>
                    <div></div>
                    <div className="text-left font-bold text-[#09121F] text-sm flex items-center">
                      {group.name}
                    </div>
                    <div></div>
                    <div></div>
                    <div className="flex justify-end items-center">
                      <button className="w-4 h-4 bg-[#09121F] text-white rounded-full flex items-center justify-center hover:bg-[#09121F]/80 transition-colors">
                        <Plus className="h-2.5 w-2.5" strokeWidth={3} />
                      </button>
                    </div>
                    {settings.invoiceMode && <div></div>}
                  </div>

                  {/* Date subhead for date sorting */}
                  {sortOption === 'date' && group.entries && group.entries.length > 0 && (
                    <div className={`grid ${gridColsWithSelection} h-[24px] items-center -mt-px`} style={{
                      gridTemplateColumns: '32px minmax(0, 1fr) minmax(0, 1fr) 40px' + (settings.invoiceMode ? ' calc(40px + 50px)' : ''),
                      gap: '0'
                    }}>
                      <div></div>
                      <div className="text-left font-bold text-[#09121F] text-sm">
                        {format(new Date(group.entries[0].date), 'MM/dd/yy')}
                      </div>
                      <div></div>
                      <div></div>
                      {settings.invoiceMode && <div></div>}
                    </div>
                  )}

                  {/* Entries under client */}
                  {group.entries?.map((entry: TimeEntry) => (
                    <div key={entry.id} className={`grid ${gridColsWithSelection} items-start hover:bg-gray-50 py-2`} style={{
                      gridTemplateColumns: '32px minmax(0, 1fr) minmax(0, 1fr) 40px' + (settings.invoiceMode ? ' calc(40px + 50px)' : ''),
                      gap: '0'
                    }}>
                      <div className="flex items-start w-[32px] self-start mt-1">
                        <div className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${selection.isSelected(entry.id) ? 'bg-gray-300' : 'bg-white'}`} onClick={() => selection.toggleSelectRecord(entry.id)} style={{
                          marginTop: '-3px'
                        }}>
                          {selection.isSelected(entry.id) && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
                        </div>
                      </div>
                      
                      {sortOption === 'project' && (
                        <>
                          <div className="text-[#09121F] text-sm leading-tight flex items-start">
                            {format(new Date(entry.date), 'MM/dd')}
                          </div>
                          <div className="text-[#09121F] text-sm leading-tight flex items-start">
                            {entry.task}
                          </div>
                        </>
                      )}
                      
                      {sortOption === 'date' && (
                        <>
                          <div className="text-[#09121F] text-sm leading-tight flex items-start">
                            {entry.project}
                          </div>
                          <div className="text-[#09121F] text-sm leading-tight flex items-start">
                            {entry.task}
                          </div>
                        </>
                      )}
                      
                      {sortOption === 'task' && (
                        <>
                          <div className="text-[#09121F] text-sm leading-tight flex items-start">
                            {format(new Date(entry.date), 'MM/dd')}
                          </div>
                          <div className="text-[#09121F] text-sm leading-tight flex items-start">
                            {entry.project}
                          </div>
                        </>
                      )}
                      
                      <div className="text-[#09121F] text-sm leading-tight text-right flex items-start justify-end">
                        {formatHours(entry.duration)}
                      </div>
                      
                      {settings.invoiceMode && (
                        <div className="text-[#09121F] text-sm leading-tight text-right flex items-start justify-end">
                          {hasTaskRate(entry.task) ? (
                            <span>${calculateFee(entry).toFixed(2)}</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">--</span>
                              <button onClick={() => handleAddRate(entry.task)} className="text-xs text-blue-600 hover:text-blue-800 underline">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="w-full">
              <div className={`grid ${gridColsWithSelection} h-[32px] items-center`} style={{
            gridTemplateColumns: '32px minmax(0, 1fr) minmax(0, 1fr) 40px' + (settings.invoiceMode ? ' calc(40px + 50px)' : ''),
            gap: '0'
          }}>
                <div className="flex items-center"></div>
                <div className="flex items-center"></div>
                <div className="text-[#09121F] text-sm font-bold flex items-center">TOTAL</div>
                <div className="text-[#09121F] text-sm font-bold text-right flex items-center justify-end">
                  {formatHours(organizedData.total.hours)}
                </div>
                {settings.invoiceMode && <div className="text-[#09121F] text-sm font-bold text-right flex items-center justify-end">
                    ${organizedData.total.fee.toFixed(2)}
                  </div>}
              </div>
              <div className="flex justify-start mt-4"></div>
            </div>
          </>}
      </div>

      {/* Export Button */}
      <div className="w-full px-2.5 py-5">
        <button onClick={handleExport} className="w-full text-white py-3.5 font-bold text-sm transition-colors" style={{
        backgroundColor: '#09121F'
      }}>
          Export/Share/Print
        </button>
      </div>

      {/* Export Dialog */}
      <ExportDialog isOpen={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)} timeEntries={timeEntries} settings={settings} viewMode={settings.invoiceMode ? 'invoice' : 'timecard'} />

      {/* Edit Dialog */}
      <EditTimeEntryDialog isOpen={!!editingEntry} onClose={() => setEditingEntry(null)} entry={editingEntry} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entries</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selection.selectedCount} selected {selection.selectedCount === 1 ? 'entry' : 'entries'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Entries</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {selection.selectedCount} selected {selection.selectedCount === 1 ? 'entry' : 'entries'}? You can restore them from the archive later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} className="bg-orange-600 hover:bg-orange-700">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};