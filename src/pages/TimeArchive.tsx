import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeEntry } from '@/types';
import { format } from 'date-fns';
import { Trash2, RotateCcw, Archive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useSelection } from '@/hooks/useSelection';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const TimeArchivePage: React.FC = () => {
  const { timeEntries, deleteTimeEntry, updateTimeEntry } = useApp();
  const { toast } = useToast();
  const selection = useSelection();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter archived entries
  const archivedEntries = timeEntries.filter(entry => entry.archived);
  const allArchivedIds = archivedEntries.map(entry => entry.id);

  const handleRestore = (ids: string[]) => {
    ids.forEach(id => {
      updateTimeEntry(id, { archived: false });
    });
    selection.clearSelection();
    toast({
      title: "Entries Restored",
      description: `${ids.length} ${ids.length === 1 ? 'entry' : 'entries'} restored to active records`
    });
  };

  const handleDelete = (ids: string[]) => {
    ids.forEach(id => {
      deleteTimeEntry(id);
    });
    selection.clearSelection();
    toast({
      title: "Entries Deleted",
      description: `${ids.length} ${ids.length === 1 ? 'entry' : 'entries'} permanently deleted`
    });
  };

  const handleClearArchive = () => {
    archivedEntries.forEach(entry => {
      deleteTimeEntry(entry.id);
    });
    selection.clearSelection();
    setShowClearDialog(false);
    toast({
      title: "Archive Cleared",
      description: "All archived entries have been permanently deleted"
    });
  };

  const formatHours = (hours: number): string => {
    return hours.toFixed(2);
  };

  const isAllSelected = allArchivedIds.length > 0 && allArchivedIds.every(id => selection.isSelected(id));

  return (
    <div className="flex flex-col h-full w-full font-gilroy">
      {/* Mode Toggle - Empty space to match TimeTally layout */}
      <div className="flex justify-center items-center w-full px-5 py-4">
        <div className="h-6" /> {/* Empty space to match TimeTally toggle height */}
      </div>

      {/* Divider */}
      <div className="h-px bg-[#09121F] mx-5 mb-6" />

      {/* Header / Selection Toolbar */}
      <div className="pt-0.5 pb-1 h-[2.75rem] px-5">
        {selection.hasAnySelected && (
          <div className="fixed left-1/2 transform -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-md px-5 z-50" style={{ top: '170px' }}>
            <div className="flex items-center gap-2 bg-gray-50 h-[2.75rem] py-2 pl-0 pr-3 justify-between rounded" style={{ boxShadow: '0 -3px 8px -1px rgba(0, 0, 0, 0.2), 0 3px 8px -1px rgba(0, 0, 0, 0.2)' }}>
              <div className="flex items-center gap-4" style={{ paddingLeft: '32px' }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRestore(selection.selectedIds)}
                  className="bg-transparent text-black hover:text-gray-600 hover:bg-transparent border-none shadow-none pl-0 gap-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(true)}
                  className="bg-transparent text-black hover:text-gray-600 hover:bg-transparent border-none shadow-none gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={selection.clearSelection}
                className="bg-transparent text-black hover:text-gray-600 hover:bg-transparent border-none shadow-none p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="flex items-baseline justify-between h-full">
          <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Time Archive</h1>
          {archivedEntries.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-transparent"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className="w-full px-5">
        <div className="grid grid-cols-5 h-[32px] items-center" style={{ gridTemplateColumns: '32px 2fr 2fr 2fr 1fr', gap: '0' }}>
          <div className="flex items-center w-[32px]">
            <div 
              className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${
                isAllSelected ? 'bg-gray-300' : 'bg-white'
              }`}
              onClick={() => selection.toggleSelectAll(allArchivedIds)}
            >
              {isAllSelected && (
                <div className="w-2 h-2 rounded-full bg-black"></div>
              )}
            </div>
          </div>
          <span className="text-[#09121F] text-sm font-bold">Date</span>
          <span className="text-[#09121F] text-sm font-bold">Project</span>
          <span className="text-[#09121F] text-sm font-bold">Task</span>
          <span className="text-[#09121F] text-sm font-bold text-right">Hours</span>
        </div>
        <div className="h-px bg-[#09121F]" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full px-5">
        {archivedEntries.length === 0 ? (
          <div className="text-center py-8">
            <Archive className="h-12 w-12 mx-auto mb-2 opacity-50 text-[#BFBFBF]" />
            <p className="text-[#BFBFBF] text-lg">No archived entries</p>
          </div>
        ) : (
          <div className="space-y-0">
            {archivedEntries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-5 h-[32px] items-center hover:bg-gray-50" style={{ gridTemplateColumns: '32px 2fr 2fr 2fr 1fr', gap: '0' }}>
                <div className="flex items-center w-[32px]">
                  <div 
                    className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${
                      selection.isSelected(entry.id) ? 'bg-gray-300' : 'bg-white'
                    }`}
                    onClick={() => selection.toggleSelectRecord(entry.id)}
                  >
                    {selection.isSelected(entry.id) && (
                      <div className="w-2 h-2 rounded-full bg-black"></div>
                    )}
                  </div>
                </div>
                <div className="text-[#09121F] text-sm">
                  {format(new Date(entry.date), 'MM/dd/yyyy')}
                </div>
                <div className="text-[#09121F] text-sm">{entry.project}</div>
                <div className="text-[#09121F] text-sm">{entry.task}</div>
                <div className="text-[#09121F] text-sm text-right">{formatHours(entry.duration)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Archive Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Archive</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {archivedEntries.length} archived entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearArchive} className="bg-red-600 hover:bg-red-700">
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
            <AlertDialogAction 
              onClick={() => {
                handleDelete(selection.selectedIds);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};