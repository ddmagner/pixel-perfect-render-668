import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeEntry } from '@/types';
import { formatCurrency, formatHours } from '@/lib/utils';

import { ChevronDown, Pencil, Trash2, Archive, Edit, X, Plus, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useSelection } from '@/hooks/useSelection';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ExportDialog } from '@/components/ExportDialog';
interface TimeTallyProps {
  onSwitchToSettings?: () => void;
}
export const TimeTally: React.FC<TimeTallyProps> = ({ onSwitchToSettings }) => {
  const {
    timeEntries,
    sortOption,
    setSortOption,
    settings,
    deleteTimeEntries,
    archiveTimeEntries,
    updateSettings,
    updateTimeEntry
  } = useApp();
  const navigate = useNavigate();
  
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingGroupHeader, setEditingGroupHeader] = useState<{ type: string; name: string } | null>(null);
  const [editingSubgroupHeader, setEditingSubgroupHeader] = useState<{ groupName: string; subgroupName: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const selection = useSelection();
  const {
    toast
  } = useToast();

  // Filter out archived entries
  const activeTimeEntries = timeEntries.filter(entry => !entry.archived);


  // Get client name by project
  const getClientByProject = (projectName: string): string => {
    const project = settings.projects.find(p => p.name === projectName);
    if (project?.clientId) {
      const client = settings.clients.find(c => c.id === project.clientId);
      return client?.name || '';
    }
    return '';
  };

  // Prefer the entry's own client, then project->client mapping, else 'No Client'
  const resolveClientName = (entry: TimeEntry): string => {
    const direct = (entry.client || '').trim();
    if (direct) return direct;
    const mapped = getClientByProject(entry.project);
    return mapped || 'No Client';
  };

  // Date helpers: compare and format without timezone conversion
  const compareDateStrAsc = (a: string, b: string) => a.localeCompare(b);
  const formatDateLabel = (dateStr: string, includeYear = false) => {
    const [y, m, d] = dateStr.split('-');
    return includeYear ? `${m}/${d}/${y.slice(2)}` : `${m}/${d}`;
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
      totalIn: { hours: 0, fee: 0 }
    };
    
    let totalInHours = 0;
    let totalInFee = 0;
    activeTimeEntries.forEach(entry => {
      totalInHours += entry.duration;
      totalInFee += calculateFee(entry);
    });

    let groups: any[] = [];

    if (sortOption === 'project') {
      // By Project: Client name -> Project name -> entries -> Sub-total -> TOTAL -> TOTAL-IN
      const clientGroups: { [key: string]: TimeEntry[] } = {};
      
      activeTimeEntries.forEach(entry => {
        const clientName = resolveClientName(entry);
        if (!clientGroups[clientName]) clientGroups[clientName] = [];
        clientGroups[clientName].push(entry);
      });

      groups = Object.entries(clientGroups).map(([clientName, clientEntries]) => {
        // Group by project within client
        const projectGroups: { [key: string]: TimeEntry[] } = {};
        clientEntries.forEach(entry => {
          if (!projectGroups[entry.project]) projectGroups[entry.project] = [];
          projectGroups[entry.project].push(entry);
        });

        const projectSubgroups = Object.entries(projectGroups).map(([projectName, projectEntries]) => {
          const sortedEntries = [...projectEntries].sort((a, b) => {
            if (a.date !== b.date) return compareDateStrAsc(a.date, b.date);
            return a.task.localeCompare(b.task);
          });

          return {
            type: 'project',
            name: projectName,
            entries: sortedEntries,
            subtotal: {
              hours: projectEntries.reduce((sum, e) => sum + e.duration, 0),
              fee: projectEntries.reduce((sum, e) => sum + calculateFee(e), 0)
            }
          };
        });

        return {
          type: 'client',
          name: clientName,
          subgroups: projectSubgroups,
          total: {
            hours: clientEntries.reduce((sum, e) => sum + e.duration, 0),
            fee: clientEntries.reduce((sum, e) => sum + calculateFee(e), 0)
          }
        };
      });

    } else if (sortOption === 'date') {
      // By Date: Date -> Client name -> entries -> Sub-total -> TOTAL -> TOTAL-IN
      const dateGroups: { [key: string]: TimeEntry[] } = {};
      
      activeTimeEntries.forEach(entry => {
        if (!dateGroups[entry.date]) dateGroups[entry.date] = [];
        dateGroups[entry.date].push(entry);
      });

      groups = Object.entries(dateGroups)
        .sort(([dateA], [dateB]) => compareDateStrAsc(dateA, dateB))
        .map(([date, dateEntries]) => {
          // Group by client within date
          const clientGroups: { [key: string]: TimeEntry[] } = {};
          dateEntries.forEach(entry => {
            const clientName = resolveClientName(entry);
            if (!clientGroups[clientName]) clientGroups[clientName] = [];
            clientGroups[clientName].push(entry);
          });

          const clientSubgroups = Object.entries(clientGroups).map(([clientName, clientEntries]) => {
            const sortedEntries = [...clientEntries].sort((a, b) => {
              if (a.project !== b.project) return a.project.localeCompare(b.project);
              return a.task.localeCompare(b.task);
            });

            return {
              type: 'client',
              name: clientName,
              entries: sortedEntries,
              subtotal: {
                hours: clientEntries.reduce((sum, e) => sum + e.duration, 0),
                fee: clientEntries.reduce((sum, e) => sum + calculateFee(e), 0)
              }
            };
          });

          return {
            type: 'date',
            name: date,
            subgroups: clientSubgroups,
            total: {
              hours: dateEntries.reduce((sum, e) => sum + e.duration, 0),
              fee: dateEntries.reduce((sum, e) => sum + calculateFee(e), 0)
            }
          };
        });

    } else if (sortOption === 'task') {
      // By Task: Task name -> Client name -> entries -> Sub-total -> TOTAL -> TOTAL-IN
      const taskGroups: { [key: string]: TimeEntry[] } = {};
      
      activeTimeEntries.forEach(entry => {
        if (!taskGroups[entry.task]) taskGroups[entry.task] = [];
        taskGroups[entry.task].push(entry);
      });

      groups = Object.entries(taskGroups).map(([taskName, taskEntries]) => {
        // Group by client within task
        const clientGroups: { [key: string]: TimeEntry[] } = {};
        taskEntries.forEach(entry => {
          const clientName = resolveClientName(entry);
          if (!clientGroups[clientName]) clientGroups[clientName] = [];
          clientGroups[clientName].push(entry);
        });

        const clientSubgroups = Object.entries(clientGroups).map(([clientName, clientEntries]) => {
          const sortedEntries = [...clientEntries].sort((a, b) => {
            if (a.date !== b.date) return compareDateStrAsc(a.date, b.date);
            return a.project.localeCompare(b.project);
          });

          return {
            type: 'client',
            name: clientName,
            entries: sortedEntries,
            subtotal: {
              hours: clientEntries.reduce((sum, e) => sum + e.duration, 0),
              fee: clientEntries.reduce((sum, e) => sum + calculateFee(e), 0)
            }
          };
        });

        return {
          type: 'task',
          name: taskName,
          subgroups: clientSubgroups,
          total: {
            hours: taskEntries.reduce((sum, e) => sum + e.duration, 0),
            fee: taskEntries.reduce((sum, e) => sum + calculateFee(e), 0)
          }
        };
      });
    }

    return {
      groups,
      totalIn: {
        hours: totalInHours,
        fee: totalInFee
      }
    };
  }, [activeTimeEntries, sortOption, settings]);

  // Get all entry IDs for selection
  const allEntryIds = useMemo(() => {
    const ids: string[] = [];
    organizedData.groups.forEach(group => {
      if (group.subgroups) {
        group.subgroups.forEach((subgroup: any) => {
          if (subgroup.entries) {
            subgroup.entries.forEach((entry: TimeEntry) => ids.push(entry.id));
          }
        });
      }
    });
    return ids;
  }, [organizedData]);
  const handleFieldEdit = (entryId: string, field: string) => {
    setEditingEntryId(entryId);
    setEditingField(field);
  };

  const handleFieldSave = async (entryId: string, field: string, value: string) => {
    const entry = activeTimeEntries.find(e => e.id === entryId);
    if (!entry) return;

    const trimmedValue = value.trim();

    // Check for duplicates when editing client or project
    if (field === 'client') {
      const existingClient = settings.clients.find(
        c => c.name.toLowerCase() === trimmedValue.toLowerCase() && c.name !== entry.client
      );
      if (existingClient && trimmedValue.toLowerCase() !== entry.client?.toLowerCase()) {
        toast({
          title: "Duplicate Client",
          description: "A client with this name already exists.",
          variant: "destructive",
        });
        setEditingEntryId(null);
        setEditingField(null);
        return;
      }
    } else if (field === 'project') {
      const existingProject = settings.projects.find(
        p => p.name.toLowerCase() === trimmedValue.toLowerCase() && p.name !== entry.project
      );
      if (existingProject && trimmedValue.toLowerCase() !== entry.project.toLowerCase()) {
        toast({
          title: "Duplicate Project",
          description: "A project with this name already exists.",
          variant: "destructive",
        });
        setEditingEntryId(null);
        setEditingField(null);
        return;
      }
    }

    const updates: Partial<TimeEntry> = {};
    
    if (field === 'date') {
      updates.date = value;
    } else if (field === 'task') {
      updates.task = trimmedValue;
    } else if (field === 'client') {
      updates.client = trimmedValue;
    } else if (field === 'project') {
      updates.project = trimmedValue;
    } else if (field === 'duration') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        updates.duration = numValue;
      } else {
        // Revert to original value if invalid
        setEditingEntryId(null);
        setEditingField(null);
        return;
      }
    }

    await updateTimeEntry(entryId, updates);
    setEditingEntryId(null);
    setEditingField(null);
  };

  const handleFieldCancel = () => {
    setEditingEntryId(null);
    setEditingField(null);
  };

  const handleGroupHeaderSave = async (oldName: string, newName: string, type: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName === oldName) {
      setEditingGroupHeader(null);
      return;
    }

    // Prevent renaming special placeholders
    if (oldName === 'No Client') {
      toast({ title: 'Cannot rename', description: 'The "No Client" group cannot be renamed.', variant: 'destructive' });
      setEditingGroupHeader(null);
      return;
    }

    // Duplicate checks against settings
    if (type === 'client') {
      const dup = settings.clients.find(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.name !== oldName);
      if (dup) {
        toast({ title: 'Duplicate Client', description: 'A client with this name already exists.', variant: 'destructive' });
        setEditingGroupHeader(null);
        return;
      }
    } else if (type === 'project') {
      const dup = settings.projects.find(p => p.name.toLowerCase() === trimmedName.toLowerCase() && p.name !== oldName);
      if (dup) {
        toast({ title: 'Duplicate Project', description: 'A project with this name already exists.', variant: 'destructive' });
        setEditingGroupHeader(null);
        return;
      }
    } else if (type === 'task') {
      const dup = settings.taskTypes.find(t => t.name.toLowerCase() === trimmedName.toLowerCase() && t.name !== oldName);
      if (dup) {
        toast({ title: 'Duplicate Task', description: 'A task with this name already exists.', variant: 'destructive' });
        setEditingGroupHeader(null);
        return;
      }
    }

    // Update all entries with this group name and persist in settings
    if (type === 'client') {
      const entriesToUpdate = activeTimeEntries.filter(e => resolveClientName(e) === oldName);
      for (const entry of entriesToUpdate) {
        await updateTimeEntry(entry.id, { client: trimmedName });
      }
      await updateSettings({
        clients: settings.clients.map(c => c.name === oldName ? { ...c, name: trimmedName } : c)
      });
    } else if (type === 'project') {
      const entriesToUpdate = activeTimeEntries.filter(e => e.project === oldName);
      for (const entry of entriesToUpdate) {
        await updateTimeEntry(entry.id, { project: trimmedName });
      }
      await updateSettings({
        projects: settings.projects.map(p => p.name === oldName ? { ...p, name: trimmedName } : p)
      });
    } else if (type === 'task') {
      const entriesToUpdate = activeTimeEntries.filter(e => e.task === oldName);
      for (const entry of entriesToUpdate) {
        await updateTimeEntry(entry.id, { task: trimmedName });
      }
      await updateSettings({
        taskTypes: settings.taskTypes.map(t => t.name === oldName ? { ...t, name: trimmedName } : t)
      });
    }

    setEditingGroupHeader(null);
  };

  const handleSubgroupHeaderSave = async (groupName: string, oldName: string, newName: string, groupType: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName === oldName) {
      setEditingSubgroupHeader(null);
      return;
    }

    if (oldName === 'No Client') {
      toast({ title: 'Cannot rename', description: 'The "No Client" group cannot be renamed.', variant: 'destructive' });
      setEditingSubgroupHeader(null);
      return;
    }

    if (groupType === 'project') {
      // Subgroups are projects under a client
      const dup = settings.projects.find(p => p.name.toLowerCase() === trimmedName.toLowerCase() && p.name !== oldName);
      if (dup) {
        toast({ title: 'Duplicate Project', description: 'A project with this name already exists.', variant: 'destructive' });
        setEditingSubgroupHeader(null);
        return;
      }

      const entriesToUpdate = activeTimeEntries.filter(e => 
        resolveClientName(e) === groupName && e.project === oldName
      );
      for (const entry of entriesToUpdate) {
        await updateTimeEntry(entry.id, { project: trimmedName });
      }
      await updateSettings({
        projects: settings.projects.map(p => p.name === oldName ? { ...p, name: trimmedName } : p)
      });
    } else if (groupType === 'date' || groupType === 'task') {
      // Subgroups are clients
      const dup = settings.clients.find(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.name !== oldName);
      if (dup) {
        toast({ title: 'Duplicate Client', description: 'A client with this name already exists.', variant: 'destructive' });
        setEditingSubgroupHeader(null);
        return;
      }

      const entriesToUpdate = activeTimeEntries.filter(e => resolveClientName(e) === oldName);
      for (const entry of entriesToUpdate) {
        await updateTimeEntry(entry.id, { client: trimmedName });
      }
      await updateSettings({
        clients: settings.clients.map(c => c.name === oldName ? { ...c, name: trimmedName } : c)
      });
    }

    setEditingSubgroupHeader(null);
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
    if (activeTimeEntries.length === 0) {
      toast({
        title: "No entries to export",
        description: "Please add some time entries first.",
        variant: "destructive",
      });
      return;
    }
    
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

  // Helper to get grid template for headers and entry rows (with narrow date column for project/task views)
  const getEntryGridTemplate = (invoice: boolean) => {
    const hasDateColumn = sortOption === 'project' || sortOption === 'task';
    if (hasDateColumn) {
      return invoice
        ? '16px 8px 0.5fr 8px 1.5fr 8px 50px 8px 60px'
        : '16px 8px 0.5fr 8px 1.5fr 8px 50px';
    } else {
      return invoice
        ? '16px 8px 1fr 8px 1fr 8px 50px 8px 60px'
        : '16px 8px 1fr 8px 1fr 8px 50px';
    }
  };

  // Helper to get grid template for sub-total/total rows (always use equal columns)
  const getRegularGridTemplate = (invoice: boolean) => {
    return invoice
      ? '16px 8px 1fr 8px 1fr 8px 50px 8px 60px'
      : '16px 8px 1fr 8px 1fr 8px 50px';
  };
  const headers = getTableHeaders();
  // Compute fixed widths for the two content columns at half their previous width
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const [contentColWidth, setContentColWidth] = useState<number>(0);

  // Sum of fixed tracks and gaps (px)
  const fixedBaseWidth = settings.invoiceMode ? 158 : 90; // 16 + 8 + 8 + 8 + 50 (+ 8 + 60 when invoice)

  const recomputeWidths = React.useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const containerWidth = el.clientWidth;
    const remaining = Math.max(0, containerWidth - fixedBaseWidth);
    // Each 1fr used to be remaining/2, half of that is remaining/4
    const halfOfEach = Math.floor(remaining / 4);
    setContentColWidth(halfOfEach);
  }, [fixedBaseWidth]);

  React.useEffect(() => {
    recomputeWidths();
    window.addEventListener('resize', recomputeWidths);
    return () => window.removeEventListener('resize', recomputeWidths);
  }, [recomputeWidths, sortOption]);

  const buildCols = (invoice: boolean) => {
    if (contentColWidth > 0) {
      return invoice
        ? `16px 8px ${contentColWidth}px 8px ${contentColWidth}px 8px 50px 8px 60px`
        : `16px 8px ${contentColWidth}px 8px ${contentColWidth}px 8px 50px`;
    }
    return invoice
      ? '16px 8px 1fr 8px 1fr 8px 50px 8px 60px'
      : '16px 8px 1fr 8px 1fr 8px 50px';
  };

  const isAllSelected = allEntryIds.length > 0 && allEntryIds.every(id => selection.isSelected(id));
  
  // Helper functions to get entry IDs for different groupings
  const getDateGroupEntryIds = (date: string, clientName: string) => {
    const group = organizedData.groups.find(g => g.name === clientName);
    if (!group?.entries) return [];
    return group.entries.filter(entry => entry.date === date).map(entry => entry.id);
  };

  const getTaskGroupEntryIds = (task: string, clientName: string) => {
    const group = organizedData.groups.find(g => g.name === clientName);
    if (!group?.entries) return [];
    return group.entries.filter(entry => entry.task === task).map(entry => entry.id);
  };

  const getClientGroupEntryIds = (clientName: string) => {
    // Find entries for a specific client across all groups/subgroups
    const entryIds: string[] = [];
    organizedData.groups.forEach(group => {
      if (group.subgroups) {
        const subgroup = group.subgroups.find((sg: any) => sg.name === clientName);
        if (subgroup?.entries) {
          entryIds.push(...subgroup.entries.map((entry: TimeEntry) => entry.id));
        }
      }
    });
    return entryIds;
  };

  const getProjectGroupEntryIds = (projectName: string, clientName: string) => {
    // For "By Project" view: find entries for a specific project within a client
    const clientGroup = organizedData.groups.find(g => g.name === clientName);
    if (!clientGroup?.subgroups) return [];
    
    const projectSubgroup = clientGroup.subgroups.find((sg: any) => sg.name === projectName);
    return projectSubgroup?.entries?.map((entry: TimeEntry) => entry.id) || [];
  };

  // Helper functions to check if groups are selected
  const isDateGroupSelected = (date: string, clientName: string) => {
    const entryIds = getDateGroupEntryIds(date, clientName);
    return entryIds.length > 0 && entryIds.every(id => selection.isSelected(id));
  };

  const isTaskGroupSelected = (task: string, clientName: string) => {
    const entryIds = getTaskGroupEntryIds(task, clientName);
    return entryIds.length > 0 && entryIds.every(id => selection.isSelected(id));
  };

  const isClientGroupSelected = (clientName: string) => {
    const entryIds = getClientGroupEntryIds(clientName);
    return entryIds.length > 0 && entryIds.every(id => selection.isSelected(id));
  };

  const isProjectGroupSelected = (project: string, clientName: string) => {
    const entryIds = getProjectGroupEntryIds(project, clientName);
    return entryIds.length > 0 && entryIds.every(id => selection.isSelected(id));
  };

  // Helper functions to toggle group selection
  const toggleDateGroupSelection = (date: string, clientName: string) => {
    const entryIds = getDateGroupEntryIds(date, clientName);
    selection.toggleSelectAll(entryIds);
  };

  const toggleTaskGroupSelection = (task: string, clientName: string) => {
    const entryIds = getTaskGroupEntryIds(task, clientName);
    selection.toggleSelectAll(entryIds);
  };

  const toggleClientGroupSelection = (clientName: string) => {
    const entryIds = getClientGroupEntryIds(clientName);
    selection.toggleSelectAll(entryIds);
  };

  const toggleProjectGroupSelection = (project: string, clientName: string) => {
    const entryIds = getProjectGroupEntryIds(project, clientName);
    selection.toggleSelectAll(entryIds);
  };

  return <div className="flex flex-col h-full w-full font-gilroy">
      {/* Divider */}

      {/* Header / Selection Toolbar */}
      <div className="pt-0.5 pb-1 h-[2.75rem] px-2.5 mb-6">
        
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
        <div className="grid h-[32px] items-center" style={{
          gridTemplateColumns: getEntryGridTemplate(settings.invoiceMode),
          gap: '0'
        }}>
          <div className="flex items-center justify-start">
            <div className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${isAllSelected ? 'bg-gray-300' : 'bg-white'}`} onClick={() => selection.toggleSelectAll(allEntryIds)}>
              {isAllSelected && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
            </div>
          </div>
          <div></div>
          {headers.map((header, index) => (
            <React.Fragment key={header}>
              <span
                className={`text-[#09121F] text-sm font-bold ${
                  header === 'Fee' ? 'text-right' : 'text-left'
                }`}
              >
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
        {organizedData.groups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#BFBFBF] text-lg">No time entered yet. Get busy.</p>
          </div>
        ) : (
          <>
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
                        // Get all entry IDs for this top-level group
                        const groupEntryIds: string[] = [];
                        if (group.subgroups) {
                          group.subgroups.forEach((subgroup: any) => {
                            if (subgroup.entries) {
                              groupEntryIds.push(...subgroup.entries.map((entry: TimeEntry) => entry.id));
                            }
                          });
                        }
                        
                        const isGroupSelected = groupEntryIds.length > 0 && groupEntryIds.every(id => selection.isSelected(id));
                        
                        return (
                          <div 
                            className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${isGroupSelected ? 'bg-gray-300' : 'bg-white'}`}
                            onClick={() => selection.toggleSelectAll(groupEntryIds)}
                          >
                            {isGroupSelected && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
                          </div>
                        );
                      })()}
                    </div>
                     <div></div>
                     <div className="text-left font-bold text-[#09121F] text-sm">
                       {editingGroupHeader?.name === group.name ? (
                         <input
                           type="text"
                           defaultValue={sortOption === 'date' ? formatDateLabel(group.name, true) : group.name}
                           className="text-sm font-bold bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 px-1 rounded w-full"
                           autoFocus
                           onBlur={(e) => handleGroupHeaderSave(group.name, sortOption === 'date' ? group.name : e.target.value, group.type)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') handleGroupHeaderSave(group.name, sortOption === 'date' ? group.name : e.currentTarget.value, group.type);
                             if (e.key === 'Escape') setEditingGroupHeader(null);
                           }}
                         />
                       ) : (
                         <span 
                           className={`${sortOption !== 'date' ? 'cursor-pointer hover:bg-gray-100 px-1 rounded' : ''}`}
                           onClick={() => sortOption !== 'date' && setEditingGroupHeader({ type: group.type, name: group.name })}
                         >
                           {sortOption === 'date' ? formatDateLabel(group.name, true) : group.name}
                         </span>
                       )}
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
                          {(() => {
                            let entryIds: string[] = [];
                            let isSelected = false;
                            
                            if (sortOption === 'project') {
                              entryIds = getProjectGroupEntryIds(subgroup.name, group.name);
                              isSelected = isProjectGroupSelected(subgroup.name, group.name);
                              
                              return (
                                <div 
                                  className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${isSelected ? 'bg-gray-300' : 'bg-white'}`}
                                  onClick={() => toggleProjectGroupSelection(subgroup.name, group.name)}
                                >
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#09121F]"></div>}
                                </div>
                              );
                            } else {
                              // For 'date' and 'task' views, no radio button on second-level subheads
                              return <div className="w-4 h-4"></div>;
                            }
                          })()}
                         </div>
                         <div></div>
                         <div className="text-left font-bold text-[#09121F] text-sm">
                           {editingSubgroupHeader?.groupName === group.name && editingSubgroupHeader?.subgroupName === subgroup.name ? (
                             <input
                               type="text"
                               defaultValue={subgroup.name}
                               className="text-sm font-bold bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 px-1 rounded w-full"
                               autoFocus
                               onBlur={(e) => handleSubgroupHeaderSave(group.name, subgroup.name, e.target.value, group.type)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleSubgroupHeaderSave(group.name, subgroup.name, e.currentTarget.value, group.type);
                                 if (e.key === 'Escape') setEditingSubgroupHeader(null);
                               }}
                             />
                           ) : (
                             <span 
                               className="cursor-pointer hover:bg-gray-100 px-1 rounded"
                               onClick={() => setEditingSubgroupHeader({ groupName: group.name, subgroupName: subgroup.name })}
                             >
                               {subgroup.name}
                             </span>
                           )}
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
                                {editingEntryId === entry.id && editingField === 'date' ? (
                                  <input
                                    type="date"
                                    defaultValue={entry.date}
                                    className="text-sm bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 px-1 rounded"
                                    autoFocus
                                    onBlur={(e) => handleFieldSave(entry.id, 'date', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleFieldSave(entry.id, 'date', e.currentTarget.value);
                                      if (e.key === 'Escape') handleFieldCancel();
                                    }}
                                  />
                                ) : (
                                  <span 
                                    className="cursor-pointer hover:bg-gray-100 pr-1 rounded text-left"
                                    onClick={() => handleFieldEdit(entry.id, 'date')}
                                  >
                                    {formatDateLabel(entry.date)}
                                  </span>
                                )}
                              </div>
                              <div></div>
                              <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                {editingEntryId === entry.id && editingField === 'task' ? (
                                  <input
                                    type="text"
                                    defaultValue={entry.task}
                                    className="text-sm bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 px-1 rounded w-full"
                                    autoFocus
                                    onBlur={(e) => handleFieldSave(entry.id, 'task', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleFieldSave(entry.id, 'task', e.currentTarget.value);
                                      if (e.key === 'Escape') handleFieldCancel();
                                    }}
                                  />
                                ) : (
                                  <span 
                                    className="cursor-pointer hover:bg-gray-100 px-1 rounded"
                                    onClick={() => handleFieldEdit(entry.id, 'task')}
                                  >
                                   {entry.task}
                                 </span>
                               )}
                             </div>
                             </React.Fragment>
                           )}
                           
                           {sortOption === 'date' && (
                             <React.Fragment>
                              <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                {editingEntryId === entry.id && editingField === 'project' ? (
                                  <input
                                    type="text"
                                    defaultValue={entry.project}
                                    className="text-sm bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 px-1 rounded w-full"
                                    autoFocus
                                    onBlur={(e) => handleFieldSave(entry.id, 'project', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleFieldSave(entry.id, 'project', e.currentTarget.value);
                                      if (e.key === 'Escape') handleFieldCancel();
                                    }}
                                  />
                                ) : (
                                  <span 
                                    className="cursor-pointer hover:bg-gray-100 px-1 rounded"
                                    onClick={() => handleFieldEdit(entry.id, 'project')}
                                  >
                                    {entry.project}
                                  </span>
                                )}
                              </div>
                              <div></div>
                              <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                {editingEntryId === entry.id && editingField === 'task' ? (
                                  <input
                                    type="text"
                                    defaultValue={entry.task}
                                    className="text-sm bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 px-1 rounded w-full"
                                    autoFocus
                                    onBlur={(e) => handleFieldSave(entry.id, 'task', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleFieldSave(entry.id, 'task', e.currentTarget.value);
                                      if (e.key === 'Escape') handleFieldCancel();
                                    }}
                                  />
                                ) : (
                                  <span 
                                    className="cursor-pointer hover:bg-gray-100 px-1 rounded"
                                    onClick={() => handleFieldEdit(entry.id, 'task')}
                                  >
                                   {entry.task}
                                 </span>
                               )}
                             </div>
                             </React.Fragment>
                           )}
                           
                           {sortOption === 'task' && (
                             <React.Fragment>
                              <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                {editingEntryId === entry.id && editingField === 'date' ? (
                                  <input
                                    type="date"
                                    defaultValue={entry.date}
                                    className="text-sm bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 px-1 rounded"
                                    autoFocus
                                    onBlur={(e) => handleFieldSave(entry.id, 'date', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleFieldSave(entry.id, 'date', e.currentTarget.value);
                                      if (e.key === 'Escape') handleFieldCancel();
                                    }}
                                  />
                                ) : (
                                  <span 
                                    className="cursor-pointer hover:bg-gray-100 pr-1 rounded"
                                    onClick={() => handleFieldEdit(entry.id, 'date')}
                                  >
                                    {formatDateLabel(entry.date)}
                                  </span>
                                )}
                              </div>
                              <div></div>
                              <div className="text-[#09121F] text-sm leading-tight flex items-start">
                                {editingEntryId === entry.id && editingField === 'project' ? (
                                  <input
                                    type="text"
                                    defaultValue={entry.project}
                                    className="text-sm bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 px-1 rounded w-full"
                                    autoFocus
                                    onBlur={(e) => handleFieldSave(entry.id, 'project', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleFieldSave(entry.id, 'project', e.currentTarget.value);
                                      if (e.key === 'Escape') handleFieldCancel();
                                    }}
                                  />
                                ) : (
                                  <span 
                                    className="cursor-pointer hover:bg-gray-100 px-1 rounded"
                                    onClick={() => handleFieldEdit(entry.id, 'project')}
                                  >
                                     {entry.project}
                                   </span>
                                 )}
                               </div>
                             </React.Fragment>
                           )}
                          
                          <div></div>
                          <div className="text-[#09121F] text-sm leading-tight text-left flex items-start justify-start">
                            {editingEntryId === entry.id && editingField === 'duration' ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={entry.duration.toString()}
                                className="text-sm bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 px-1 rounded w-12 text-left"
                                autoFocus
                                onBlur={(e) => handleFieldSave(entry.id, 'duration', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleFieldSave(entry.id, 'duration', e.currentTarget.value);
                                  if (e.key === 'Escape') handleFieldCancel();
                                }}
                              />
                            ) : (
                              <span 
                                className="cursor-pointer hover:bg-gray-100 rounded text-left"
                                onClick={() => handleFieldEdit(entry.id, 'duration')}
                              >
                                {formatHours(entry.duration)}
                              </span>
                            )}
                          </div>
                          
                          {settings.invoiceMode && (
                            <>
                              <div></div>
                              <div className="text-[#09121F] text-sm leading-tight flex items-start justify-end">
                              {hasTaskRate(entry.task) ? (
                                <span>{formatCurrency(calculateFee(entry))}</span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400">--</span>
                                  <button onClick={() => handleAddRate(entry.task)} className="text-xs text-blue-600 hover:text-blue-800 underline">
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                       {/* Sub-total */}
                       <div className="grid h-[32px] items-center" style={{
                         gridTemplateColumns: getRegularGridTemplate(settings.invoiceMode),
                         gap: '0'
                       }}>
                        <div></div>
                        <div></div>
                        <div className="text-[#09121F] text-sm font-bold text-left">Sub-total</div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div className="text-[#09121F] text-sm font-bold text-left">
                          {formatHours(subgroup.subtotal.hours)}
                        </div>
                        {settings.invoiceMode && (
                          <>
                            <div></div>
                            <div className="text-[#09121F] text-sm font-bold flex items-center justify-end">
                              {formatCurrency(subgroup.subtotal.fee)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                   {/* TOTAL for this group */}
                   <div className="grid h-[32px] items-center" style={{
                     gridTemplateColumns: getRegularGridTemplate(settings.invoiceMode),
                     gap: '0'
                   }}>
                    <div></div>
                    <div></div>
                    <div className="text-[#09121F] text-sm font-bold text-left">TOTAL</div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div className="text-[#09121F] text-sm font-bold text-left">
                      {formatHours(group.total.hours)}
                    </div>
                    {settings.invoiceMode && (
                      <>
                        <div></div>
                        <div className="text-[#09121F] text-sm font-bold flex items-center justify-end">
                          {formatCurrency(group.total.fee)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

             {/* TOTAL-IN */}
             <div className="w-full border-t-2 border-[#09121F] mt-4">
               <div className="grid h-[32px] items-center" style={{
                 gridTemplateColumns: getRegularGridTemplate(settings.invoiceMode),
                 gap: '0'
               }}>
                <div></div>
                <div></div>
                <div className="text-[#09121F] text-sm font-bold text-left">TOTAL-IN</div>
                <div></div>
                <div></div>
                <div></div>
                <div className="text-[#09121F] text-sm font-bold text-left">
                  {formatHours(organizedData.totalIn.hours)}
                </div>
                {settings.invoiceMode && (
                  <>
                    <div></div>
                    <div className="text-[#09121F] text-sm font-bold flex items-center justify-end">
                      {formatCurrency(organizedData.totalIn.fee)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full px-2.5 py-5 space-y-3">
        <button onClick={handleExport} className="w-full text-white py-3.5 font-bold text-sm transition-colors" style={{
        backgroundColor: '#09121F'
      }}>
          Export/Share/Print
        </button>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowDeleteDialog(true)} 
            className="flex-1 bg-white border border-[#09121F] text-[#09121F] py-3.5 font-bold text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selection.hasAnySelected}
          >
            Delete
          </button>
          <button 
            onClick={() => setShowArchiveDialog(true)} 
            className="flex-1 bg-white border border-[#09121F] text-[#09121F] py-3.5 font-bold text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selection.hasAnySelected}
          >
            Archive
          </button>
        </div>
      </div>

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

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        timeEntries={activeTimeEntries}
        selectedEntries={selection.selectedIds.length > 0 
          ? activeTimeEntries.filter(entry => selection.selectedIds.includes(entry.id))
          : undefined
        }
        settings={settings}
        viewMode={settings.invoiceMode ? 'invoice' : 'timecard'}
      />
    </div>;
};