import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeEntry } from '@/types';
import { format } from 'date-fns';
import { Trash2, RotateCcw, Archive } from 'lucide-react';
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

export const TimeArchive: React.FC = () => {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#09121F] flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Time Archive ({archivedEntries.length})
        </h3>
        
        {archivedEntries.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowClearDialog(true)}
            className="text-red-600 hover:text-red-700"
          >
            Clear Archive
          </Button>
        )}
      </div>

      {archivedEntries.length === 0 ? (
        <div className="text-center py-8 text-[#BFBFBF]">
          <Archive className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No archived entries</p>
        </div>
      ) : (
        <>
          {/* Selection toolbar */}
          {selection.hasAnySelected && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selection.selectedCount} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestore(selection.selectedIds)}
                className="text-green-600 hover:text-green-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={selection.clearSelection}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Archive table */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 border-b">
              <div className="flex items-center">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => selection.toggleSelectAll(allArchivedIds)}
                />
              </div>
              <div className="font-medium text-sm">Date</div>
              <div className="font-medium text-sm">Project</div>
              <div className="font-medium text-sm">Task</div>
              <div className="font-medium text-sm text-right">Hours</div>
              <div className="font-medium text-sm text-center">Actions</div>
            </div>

            {/* Entries */}
            {archivedEntries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-6 gap-4 p-3 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex items-center">
                  <Checkbox
                    checked={selection.isSelected(entry.id)}
                    onCheckedChange={() => selection.toggleSelectRecord(entry.id)}
                  />
                </div>
                <div className="text-sm">
                  {format(new Date(entry.date), 'MM/dd/yyyy')}
                </div>
                <div className="text-sm">{entry.project}</div>
                <div className="text-sm">{entry.task}</div>
                <div className="text-sm text-right">{formatHours(entry.duration)}</div>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRestore([entry.id])}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete([entry.id])}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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