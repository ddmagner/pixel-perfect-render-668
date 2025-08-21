import { useState, useCallback } from 'react';

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectRecord = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback((allIds: string[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      const hasAllSelected = allIds.every(id => newSet.has(id));
      
      if (hasAllSelected) {
        // Deselect all
        allIds.forEach(id => newSet.delete(id));
      } else {
        // Select all
        allIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const hasAnySelected = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  return {
    selectedIds: Array.from(selectedIds),
    toggleSelectRecord,
    toggleSelectAll,
    clearSelection,
    isSelected,
    hasAnySelected,
    selectedCount
  };
}