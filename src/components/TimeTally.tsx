import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeEntry } from '@/types';
import { format } from 'date-fns';
import { Share } from '@capacitor/share';
import { generatePDF } from '@/utils/pdfGenerator';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const TimeTally: React.FC = () => {
  const { timeEntries, sortOption, setSortOption, viewMode, setViewMode, settings } = useApp();

  // Format hours as MM:SS
  const formatHours = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const mins = Math.floor(totalMinutes / 60);
    const secs = totalMinutes % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // Calculate fee for an entry
  const calculateFee = (entry: TimeEntry): number => {
    if (viewMode !== 'invoice') return 0;
    return entry.duration * getTaskRate(entry.task);
  };

  // Group and sort entries based on sort option
  const organizedData = useMemo(() => {
    if (timeEntries.length === 0) return { groups: [], total: { hours: 0, fee: 0 } };

    let groups: any[] = [];
    let totalHours = 0;
    let totalFee = 0;

    timeEntries.forEach(entry => {
      totalHours += entry.duration;
      totalFee += calculateFee(entry);
    });

    if (sortOption === 'project') {
      // Group by Client > Project > Individual entries
      const clientGroups: { [key: string]: { [key: string]: TimeEntry[] } } = {};
      
      timeEntries.forEach(entry => {
        const clientName = getClientByProject(entry.project) || 'No Client';
        const projectName = entry.project;
        
        if (!clientGroups[clientName]) clientGroups[clientName] = {};
        if (!clientGroups[clientName][projectName]) clientGroups[clientName][projectName] = [];
        clientGroups[clientName][projectName].push(entry);
      });

      groups = Object.entries(clientGroups).map(([clientName, projects]) => ({
        type: 'client',
        name: clientName,
        projects: Object.entries(projects).map(([projectName, entries]) => ({
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
      // Group by Date > Project > Task
      const dateGroups: { [key: string]: { [key: string]: TimeEntry[] } } = {};
      
      timeEntries.forEach(entry => {
        const dateKey = format(new Date(entry.date), 'MM/dd');
        const projectKey = entry.project;
        
        if (!dateGroups[dateKey]) dateGroups[dateKey] = {};
        if (!dateGroups[dateKey][projectKey]) dateGroups[dateKey][projectKey] = [];
        dateGroups[dateKey][projectKey].push(entry);
      });

      groups = Object.entries(dateGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, projects]) => ({
          type: 'date',
          name: date,
          projects: Object.entries(projects).map(([projectName, entries]) => ({
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
      // Group by Task > Date + Project combinations
      const taskGroups: { [key: string]: TimeEntry[] } = {};
      
      timeEntries.forEach(entry => {
        const taskName = entry.task;
        if (!taskGroups[taskName]) taskGroups[taskName] = [];
        taskGroups[taskName].push(entry);
      });

      groups = Object.entries(taskGroups).map(([taskName, entries]) => ({
        type: 'task',
        name: taskName,
        entries: entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        subtotal: {
          hours: entries.reduce((sum, e) => sum + e.duration, 0),
          fee: entries.reduce((sum, e) => sum + calculateFee(e), 0)
        }
      }));
    }

    return { groups, total: { hours: totalHours, fee: totalFee } };
  }, [timeEntries, sortOption, viewMode, settings]);

  const handleExport = async () => {
    try {
      const pdfBlob = await generatePDF(timeEntries, settings, viewMode);
      const fileName = `time-${viewMode}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      const url = URL.createObjectURL(pdfBlob);
      
      if (await Share.canShare()) {
        await Share.share({
          title: fileName,
          text: `Time ${viewMode} report`,
          url: url,
        });
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
      }
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  // Get sort option display text
  const getSortOptionText = () => {
    switch (sortOption) {
      case 'project': return 'By Project';
      case 'date': return 'By Date';
      case 'task': return 'By Task';
      default: return 'By Project';
    }
  };

  // Get table headers based on sort option
  const getTableHeaders = () => {
    if (sortOption === 'project') {
      return viewMode === 'invoice' 
        ? ['Date', 'Task', 'Hours', 'Fee']
        : ['Date', 'Task', 'Hours'];
    } else if (sortOption === 'date') {
      return viewMode === 'invoice'
        ? ['Project', 'Task', 'Hours', 'Fee']
        : ['Project', 'Task', 'Hours'];
    } else { // task
      return viewMode === 'invoice'
        ? ['Date', 'Project', 'Hours', 'Fee']
        : ['Date', 'Project', 'Hours'];
    }
  };

  const headers = getTableHeaders();
  const gridCols = viewMode === 'invoice' ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className="flex flex-col h-full w-full font-gilroy">
      {/* Mode Toggle */}
      <div className="flex justify-center items-center w-full px-5 py-4">
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${viewMode === 'timecard' ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
            Time Card Mode
          </span>
          <button
            onClick={() => setViewMode(viewMode === 'timecard' ? 'invoice' : 'timecard')}
            className={`w-12 h-6 rounded-full transition-colors ${
              viewMode === 'invoice' ? 'bg-[#09121F]' : 'bg-[#BFBFBF]'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform ${
                viewMode === 'invoice' ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${viewMode === 'invoice' ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
            Invoice Mode
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#09121F] mx-5 mb-6" />

      {/* Header */}
      <div className="flex items-baseline justify-between px-5 py-6">
        <h1 className="text-[#09121F] text-[28px] font-bold leading-8">
          Where time went
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-sm font-medium text-[#09121F] hover:bg-gray-50">
              {getSortOptionText()}
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-[#09121F] rounded-lg shadow-lg">
            <DropdownMenuItem 
              onClick={() => setSortOption('project')}
              className="text-sm font-medium text-[#09121F] hover:bg-gray-50 cursor-pointer"
            >
              By Project
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortOption('date')}
              className="text-sm font-medium text-[#09121F] hover:bg-gray-50 cursor-pointer"
            >
              By Date
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortOption('task')}
              className="text-sm font-medium text-[#09121F] hover:bg-gray-50 cursor-pointer"
            >
              By Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table Header */}
      <div className="w-full pb-2 px-5">
        <div className={`grid ${gridCols} gap-4 pb-2`}>
          {headers.map((header, index) => (
            <span 
              key={header} 
              className={`text-[#09121F] text-sm font-bold ${index === headers.length - 1 ? 'text-right' : ''}`}
            >
              {header}
            </span>
          ))}
        </div>
        <div className="h-px bg-[#09121F] mt-2 mb-4" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full px-5">
        {organizedData.groups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#BFBFBF] text-lg">No time entries found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {organizedData.groups.map((group, groupIndex) => (
              <div key={`${group.type}-${group.name}-${groupIndex}`}>
                {/* Group Header */}
                <div className="font-bold text-[#09121F] text-sm mb-2">
                  {group.name}
                </div>

                {/* Group Content */}
                {sortOption === 'project' && group.projects ? (
                  group.projects.map((project: any, projectIndex: number) => (
                    <div key={`project-${project.name}-${projectIndex}`} className="mb-4">
                      <div className="font-bold text-[#09121F] text-sm ml-4 mb-2">
                        {project.name}
                      </div>
                      
                      {project.entries.map((entry: TimeEntry) => (
                        <div key={entry.id} className={`grid ${gridCols} gap-4 py-1`}>
                          <div className="text-[#BFBFBF] text-sm">
                            {format(new Date(entry.date), 'MM/dd')}
                          </div>
                          <div className="text-[#09121F] text-sm">
                            {entry.task}
                          </div>
                          <div className="text-[#09121F] text-sm text-right">
                            {formatHours(entry.duration)}
                          </div>
                          {viewMode === 'invoice' && (
                            <div className="text-[#09121F] text-sm text-right">
                              ${calculateFee(entry).toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div className={`grid ${gridCols} gap-4 py-1 border-t border-[#09121F] mt-2 pt-2`}>
                        <div></div>
                        <div className="text-[#09121F] text-sm font-bold">Sub-total</div>
                        <div className="text-[#09121F] text-sm font-bold text-right">
                          {formatHours(project.subtotal.hours)}
                        </div>
                        {viewMode === 'invoice' && (
                          <div className="text-[#09121F] text-sm font-bold text-right">
                            ${project.subtotal.fee.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : sortOption === 'date' && group.projects ? (
                  <div>
                    {group.projects.map((project: any, projectIndex: number) => (
                      <div key={`date-project-${project.name}-${projectIndex}`}>
                        {project.entries.map((entry: TimeEntry) => (
                          <div key={entry.id} className={`grid ${gridCols} gap-4 py-1 ml-4`}>
                            <div className="text-[#09121F] text-sm">
                              {entry.project}
                            </div>
                            <div className="text-[#09121F] text-sm">
                              {entry.task}
                            </div>
                            <div className="text-[#09121F] text-sm text-right">
                              {formatHours(entry.duration)}
                            </div>
                            {viewMode === 'invoice' && (
                              <div className="text-[#09121F] text-sm text-right">
                                ${calculateFee(entry).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                    
                    <div className={`grid ${gridCols} gap-4 py-1 border-t border-[#09121F] mt-2 pt-2`}>
                      <div></div>
                      <div className="text-[#09121F] text-sm font-bold">Sub-total</div>
                      <div className="text-[#09121F] text-sm font-bold text-right">
                        {formatHours(group.subtotal.hours)}
                      </div>
                      {viewMode === 'invoice' && (
                        <div className="text-[#09121F] text-sm font-bold text-right">
                          ${group.subtotal.fee.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ) : sortOption === 'task' && group.entries ? (
                  <div>
                    {group.entries.map((entry: TimeEntry) => (
                      <div key={entry.id} className={`grid ${gridCols} gap-4 py-1 ml-4`}>
                        <div className="text-[#BFBFBF] text-sm">
                          {format(new Date(entry.date), 'MM/dd')}
                        </div>
                        <div className="text-[#09121F] text-sm">
                          {entry.project}
                        </div>
                        <div className="text-[#09121F] text-sm text-right">
                          {formatHours(entry.duration)}
                        </div>
                        {viewMode === 'invoice' && (
                          <div className="text-[#09121F] text-sm text-right">
                            ${calculateFee(entry).toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className={`grid ${gridCols} gap-4 py-1 border-t border-[#09121F] mt-2 pt-2`}>
                      <div></div>
                      <div className="text-[#09121F] text-sm font-bold">Sub-total</div>
                      <div className="text-[#09121F] text-sm font-bold text-right">
                        {formatHours(group.subtotal.hours)}
                      </div>
                      {viewMode === 'invoice' && (
                        <div className="text-[#09121F] text-sm font-bold text-right">
                          ${group.subtotal.fee.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {/* Total */}
            <div className="pt-4 w-full border-t border-[#09121F] mt-6">
              <div className={`grid ${gridCols} gap-4 py-2`}>
                <div></div>
                <div className="text-[#09121F] text-sm font-bold">TOTAL</div>
                <div className="text-[#09121F] text-sm font-bold text-right">
                  {formatHours(organizedData.total.hours)}
                </div>
                {viewMode === 'invoice' && (
                  <div className="text-[#09121F] text-sm font-bold text-right">
                    ${organizedData.total.fee.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex justify-start mt-2">
                <button className="text-[#09121F] text-sm flex items-center gap-1">
                  Press & hold line items to <Pencil className="h-3.5 w-3.5" /> or <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="w-full px-5 py-5">
        <button
          onClick={handleExport}
          className="w-full text-white py-4 rounded-lg font-bold text-sm transition-colors"
          style={{ backgroundColor: settings.accentColor }}
        >
          Export/Share/Print
        </button>
      </div>
    </div>
  );
};