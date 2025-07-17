import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeEntry, SortOption, ViewMode } from '@/types';
import { format } from 'date-fns';
import { Share } from '@capacitor/share';
import { generatePDF } from '@/utils/pdfGenerator';

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
    <div className="flex flex-col items-start flex-1 self-stretch px-5 py-5">
      {/* Header */}
      <header className="flex justify-between items-center w-full mb-6">
        <h1 className="text-[#09121F] text-[28px] font-bold leading-8 tracking-[-0.56px]">
          Time Tally
        </h1>
        
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'timecard' 
                ? 'bg-[#09121F] text-white' 
                : 'text-[#09121F] hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('timecard')}
          >
            Time Card
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'invoice' 
                ? 'bg-[#09121F] text-white' 
                : 'text-[#09121F] hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('invoice')}
          >
            Invoice
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 w-full mb-4">
        {/* Sort Options */}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#09121F]"
        >
          <option value="date">Sort by Date</option>
          <option value="project">Sort by Project</option>
          <option value="task">Sort by Task</option>
          <option value="client">Sort by Client</option>
        </select>

        {/* Client Filter */}
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#09121F]"
        >
          <option value="all">All Clients</option>
          {settings.clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-[#09121F] text-white rounded-md text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
        >
          Export PDF
        </button>
      </div>

      {/* Summary */}
      <div className="w-full bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-[#09121F] font-medium">Total Hours:</span>
          <span className="text-[#09121F] font-bold">{totalHours.toFixed(2)}</span>
        </div>
        {viewMode === 'invoice' && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-[#09121F] font-medium">Total Amount:</span>
            <span className="text-[#09121F] font-bold">${totalAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-1 w-full">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#BFBFBF] text-lg">No time entries found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry) => (
              <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-[#09121F] font-medium text-lg">{entry.task}</h3>
                    <p className="text-gray-600 text-sm">{entry.project}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#09121F] font-bold text-lg">{entry.duration}h</p>
                    {viewMode === 'invoice' && (
                      <p className="text-gray-600 text-sm">
                        ${((settings.taskTypes.find(t => t.name === entry.task)?.hourlyRate || 0) * entry.duration).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                  <span>{format(new Date(entry.submittedAt), 'h:mm a')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};