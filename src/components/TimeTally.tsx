import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeEntry, SortOption, ViewMode } from '@/types';
import { format } from 'date-fns';
import { Share } from '@capacitor/share';
import { generatePDF } from '@/utils/pdfGenerator';

interface GroupedEntries {
  [projectName: string]: TimeEntry[];
}

export const TimeTally: React.FC = () => {
  const { timeEntries, sortOption, setSortOption, viewMode, setViewMode, settings } = useApp();
  const [selectedClient, setSelectedClient] = useState<string>('all');

  // Sort and filter time entries
  const sortedEntries = useMemo(() => {
    let filtered = timeEntries;

    // Filter by client if selected
    if (selectedClient !== 'all') {
      filtered = timeEntries.filter(entry => {
        const project = settings.projects.find(p => p.name === entry.project);
        return project?.clientId === selectedClient;
      });
    }

    // Sort entries
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'project':
          return a.project.localeCompare(b.project);
        case 'task':
          return a.task.localeCompare(b.task);
        case 'client':
          const aClient = settings.projects.find(p => p.name === a.project)?.clientId || '';
          const bClient = settings.projects.find(p => p.name === b.project)?.clientId || '';
          return aClient.localeCompare(bClient);
        default:
          return 0;
      }
    });
  }, [timeEntries, sortOption, selectedClient, settings.projects]);

  // Group entries by project
  const groupedEntries = useMemo(() => {
    const grouped: GroupedEntries = {};
    sortedEntries.forEach(entry => {
      if (!grouped[entry.project]) {
        grouped[entry.project] = [];
      }
      grouped[entry.project].push(entry);
    });
    return grouped;
  }, [sortedEntries]);

  // Calculate totals
  const totalHours = useMemo(() => {
    return sortedEntries.reduce((sum, entry) => sum + entry.duration, 0);
  }, [sortedEntries]);

  const totalAmount = useMemo(() => {
    if (viewMode !== 'invoice') return 0;
    return sortedEntries.reduce((sum, entry) => {
      const taskType = settings.taskTypes.find(t => t.name === entry.task);
      const rate = taskType?.hourlyRate || 0;
      return sum + (entry.duration * rate);
    }, 0);
  }, [sortedEntries, viewMode, settings.taskTypes]);

  const getProjectSubtotal = (entries: TimeEntry[]) => {
    return entries.reduce((sum, entry) => sum + entry.duration, 0);
  };

  const handleExport = async () => {
    try {
      const pdfBlob = await generatePDF(sortedEntries, settings, viewMode);
      const fileName = `time-${viewMode}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      // Create a URL for the PDF
      const url = URL.createObjectURL(pdfBlob);
      
      // Try to use native share if available
      if (await Share.canShare()) {
        await Share.share({
          title: fileName,
          text: `Time ${viewMode} report`,
          url: url,
        });
      } else {
        // Fallback to download
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

  return (
    <div className="flex flex-col h-full w-full">
      {/* Mode Toggle */}
      <div className="flex justify-center items-center w-full px-5 py-4 border-b">
        <div className="flex items-center gap-4">
          <span className={`text-[15px] font-medium ${viewMode === 'timecard' ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
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
          <span className={`text-[15px] font-medium ${viewMode === 'invoice' ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
            Invoice Mode
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between w-full min-w-full px-5 py-6">
        <h1 className="text-[#09121F] text-[28px] font-bold leading-8">
          Where time went.
        </h1>
        <button
          onClick={() => setSortOption('project')}
          className="text-[#09121F] text-[15px] font-medium underline"
        >
          By Project
        </button>
      </div>

      {/* Table Header */}
      <div className="w-full pb-2">
        <div className="grid grid-cols-3 gap-4 pb-2 border-b border-[#09121F] mx-5">
          <span className="text-[#09121F] text-[15px] font-bold">Date/Time</span>
          <span className="text-[#09121F] text-[15px] font-bold">Task</span>
          <span className="text-[#09121F] text-[15px] font-bold text-right">Hours</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full">
        {Object.keys(groupedEntries).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#BFBFBF] text-lg">No time entries found</p>
          </div>
        ) : (
          <div className="space-y-6 mx-5">
            {Object.entries(groupedEntries).map(([projectName, entries]) => (
              <div key={projectName}>
                {/* Project Name */}
                <h3 className="text-[#09121F] text-[18px] font-bold py-3 w-full">
                  {projectName}
                </h3>
                
                {/* Project Entries */}
                <div className="space-y-2 w-full">
                  {entries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-3 gap-4 py-2">
                      <div className="text-[#BFBFBF] text-[15px]">
                        {format(new Date(entry.date), 'MM/dd')} {format(new Date(entry.submittedAt), 'HH:mm')}
                      </div>
                      <div className="text-[#09121F] text-[15px]">
                        /{entry.task}/
                      </div>
                      <div className="text-[#09121F] text-[15px] text-right">
                        /{entry.duration.toFixed(1)}h/
                      </div>
                    </div>
                  ))}
                </div>

                {/* Project Subtotal */}
                <div className="grid grid-cols-3 gap-4 py-2 border-t border-gray-300 mt-2 w-full">
                  <div></div>
                  <div className="text-[#09121F] text-[15px] font-bold">
                    Sub-total
                  </div>
                  <div className="text-[#09121F] text-[15px] font-bold text-right">
                    /{getProjectSubtotal(entries).toFixed(1)}h/
                  </div>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="border-t-2 border-[#09121F] pt-4 w-full">
              <div className="grid grid-cols-3 gap-4 py-2">
                <div></div>
                <div className="text-[#09121F] text-[18px] font-bold">
                  TOTAL
                </div>
                <div className="text-[#09121F] text-[18px] font-bold text-right">
                  /{totalHours.toFixed(1)}h/
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button className="text-[#09121F] text-[15px] underline">
                  +/-/Edit
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
          className="w-full text-white py-4 rounded-lg font-bold text-[15px] transition-colors"
          style={{ backgroundColor: settings.accentColor }}
        >
          Export/Share/Print
        </button>
      </div>
    </div>
  );
};