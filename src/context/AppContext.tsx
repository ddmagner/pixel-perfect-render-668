import React, { createContext, useContext, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { TimeEntry, AppSettings, SortOption, ViewMode } from '@/types';

interface AppContextType {
  timeEntries: TimeEntry[];
  settings: AppSettings;
  sortOption: SortOption;
  viewMode: ViewMode;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'submittedAt'>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setSortOption: (option: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  deleteTimeEntry: (id: string) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  archiveTimeEntries: (ids: string[]) => void;
  deleteTimeEntries: (ids: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
  accentColor: '#09121F',
  invoiceMode: false,
  taskTypes: [
    { id: '1', name: 'Development', hourlyRate: 75 },
    { id: '2', name: 'Design', hourlyRate: 65 },
    { id: '3', name: 'Meeting', hourlyRate: 50 },
    { id: '4', name: 'Research', hourlyRate: 60 },
  ],
  projects: [
    { id: '1', name: 'Project Alpha' },
    { id: '2', name: 'Project Beta' },
  ],
  clients: [
    { id: '1', name: 'Client A' },
    { id: '2', name: 'Client B' },
  ],
  userProfile: {
    name: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
    city: '',
    state: '',
  },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [timeEntries, setTimeEntries] = useStorage<TimeEntry[]>('timeEntries', []);
  const [settings, setSettings] = useStorage<AppSettings>('settings', defaultSettings);
  const [sortOption, setSortOption] = useStorage<SortOption>('sortOption', 'date');
  const [viewMode, setViewMode] = useStorage<ViewMode>('viewMode', 'timecard');

  const addTimeEntry = (entry: Omit<TimeEntry, 'id' | 'submittedAt'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
    };
    setTimeEntries([...timeEntries, newEntry]);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const deleteTimeEntry = (id: string) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== id));
  };

  const updateTimeEntry = (id: string, updates: Partial<TimeEntry>) => {
    setTimeEntries(timeEntries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  };

  const archiveTimeEntries = (ids: string[]) => {
    setTimeEntries(timeEntries.map(entry => 
      ids.includes(entry.id) ? { ...entry, archived: true } : entry
    ));
  };

  const deleteTimeEntries = (ids: string[]) => {
    setTimeEntries(timeEntries.filter(entry => !ids.includes(entry.id)));
  };

  const value: AppContextType = {
    timeEntries,
    settings,
    sortOption,
    viewMode,
    addTimeEntry,
    updateSettings,
    setSortOption,
    setViewMode,
    deleteTimeEntry,
    updateTimeEntry,
    archiveTimeEntries,
    deleteTimeEntries,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}