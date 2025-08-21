import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeEntry } from '@/types';
import { format } from 'date-fns';
import { Trash2, RotateCcw, Archive, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useSelection } from '@/hooks/useSelection';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
export const TimeArchivePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    timeEntries,
    deleteTimeEntry,
    updateTimeEntry
  } = useApp();
  const {
    toast
  } = useToast();
  const selection = useSelection();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter archived entries
  const archivedEntries = timeEntries.filter(entry => entry.archived);
  const allArchivedIds = archivedEntries.map(entry => entry.id);
  const handleRestore = (ids: string[]) => {
    ids.forEach(id => {
      updateTimeEntry(id, {
        archived: false
      });
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
  const formatHours = (hours: number): string => {
    return hours.toFixed(2);
  };
  const isAllSelected = allArchivedIds.length > 0 && allArchivedIds.every(id => selection.isSelected(id));
  return <div className="flex flex-col h-full w-full font-gilroy">
      {/* Header / Selection Toolbar */}
      <div className="pt-0.5 pb-1 h-[2.75rem] px-5">
        {selection.hasAnySelected && <div className="fixed left-1/2 transform -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-md px-5 z-50" style={{
        top: '170px'
      }}>
            <div className="flex items-center gap-2 bg-gray-50 h-[2.75rem] py-2 pl-0 pr-3 justify-between rounded" style={{
          boxShadow: '0 -3px 8px -1px rgba(0, 0, 0, 0.2), 0 3px 8px -1px rgba(0, 0, 0, 0.2)'
        }}>
              <div className="flex items-center gap-4" style={{
            paddingLeft: '32px'
          }}>
                <Button size="sm" variant="ghost" onClick={() => handleRestore(selection.selectedIds)} className="bg-transparent text-black hover:text-gray-600 hover:bg-transparent border-none shadow-none pl-0 gap-1">
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowDeleteDialog(true)} className="bg-transparent text-black hover:text-gray-600 hover:bg-transparent border-none shadow-none gap-1">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={selection.clearSelection} className="bg-transparent text-black hover:text-gray-600 hover:bg-transparent border-none shadow-none p-1">
                <span className="text-sm">Clear</span>
              </Button>
            </div>
          </div>}
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')} 
              className="p-1 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Time Archive</h1>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#09121F] mx-5 mb-6" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full px-5">
        {archivedEntries.length === 0 ? <div className="text-center py-8">
            <Archive className="h-12 w-12 mx-auto mb-2 opacity-50 text-[#BFBFBF]" />
            <p className="text-[#BFBFBF] text-lg">No archived entries</p>
          </div> : <>
            {/* Table Header */}
            <div className="grid grid-cols-5 h-[32px] items-center" style={{
          gridTemplateColumns: '32px 2fr 2fr 2fr 1fr',
          gap: '0'
        }}>
              <div className="flex items-center w-[32px]">
                <div className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${isAllSelected ? 'bg-gray-300' : 'bg-white'}`} onClick={() => selection.toggleSelectAll(allArchivedIds)}>
                  {isAllSelected && <div className="w-2 h-2 rounded-full bg-black"></div>}
                </div>
              </div>
              <span className="text-[#09121F] text-sm font-bold">Date</span>
              <span className="text-[#09121F] text-sm font-bold">Project</span>
              <span className="text-[#09121F] text-sm font-bold">Task</span>
              <span className="text-[#09121F] text-sm font-bold text-right">Hours</span>
            </div>
            <div className="h-px bg-[#09121F] mb-4" />

            {/* Entries */}
            <div className="space-y-0">
              {archivedEntries.map(entry => <div key={entry.id} className="grid grid-cols-5 h-[32px] items-center hover:bg-gray-50" style={{
            gridTemplateColumns: '32px 2fr 2fr 2fr 1fr',
            gap: '0'
          }}>
                  <div className="flex items-center w-[32px]">
                    <div className={`w-4 h-4 rounded-full border-2 border-gray-300 cursor-pointer flex items-center justify-center ${selection.isSelected(entry.id) ? 'bg-gray-300' : 'bg-white'}`} onClick={() => selection.toggleSelectRecord(entry.id)}>
                      {selection.isSelected(entry.id) && <div className="w-2 h-2 rounded-full bg-black"></div>}
                    </div>
                  </div>
                  <div className="text-[#09121F] text-sm">
                    {format(new Date(entry.date), 'MM/dd/yyyy')}
                  </div>
                  <div className="text-[#09121F] text-sm">{entry.project}</div>
                  <div className="text-[#09121F] text-sm">{entry.task}</div>
                  <div className="text-[#09121F] text-sm text-right">{formatHours(entry.duration)}</div>
                </div>)}
            </div>
          </>}
      </div>


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
          }} className="bg-red-600 hover:bg-red-700">
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};