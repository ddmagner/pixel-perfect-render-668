import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TimeEntry, AppSettings, SortOption, ViewMode } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  timeEntries: TimeEntry[];
  settings: AppSettings;
  sortOption: SortOption;
  viewMode: ViewMode;
  loading: boolean;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'submittedAt'>) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setSortOption: (option: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  deleteTimeEntry: (id: string) => Promise<void>;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>;
  archiveTimeEntries: (ids: string[]) => Promise<void>;
  deleteTimeEntries: (ids: string[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
  accentColor: 'hsl(0, 0%, 85%)', // Light gray as default secondary color
  invoiceMode: false,
  taskTypes: [],
  projects: [],
  clients: [],
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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load viewMode from localStorage on initialization
    const saved = localStorage.getItem('timeapp-viewmode');
    return (saved as ViewMode) || 'timecard';
  });
  const [loading, setLoading] = useState(true);

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else if (!authLoading) {
      // Reset data when user logs out
      setTimeEntries([]);
      setSettings(defaultSettings);
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load time entries
      const { data: timeEntriesData, error: timeEntriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (timeEntriesError) throw timeEntriesError;

      // Load app settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);

      if (clientsError) throw clientsError;

      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (projectsError) throw projectsError;

      // Load task types
      const { data: taskTypesData, error: taskTypesError } = await supabase
        .from('task_types')
        .select('*')
        .eq('user_id', user.id);

      if (taskTypesError) throw taskTypesError;

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Transform data to match existing interfaces
      setTimeEntries((timeEntriesData || []).map(entry => ({
        id: entry.id,
        duration: Number(entry.duration),
        task: entry.task,
        project: entry.project,
        client: entry.client || '',
        date: entry.date,
        submittedAt: entry.submitted_at,
        hourlyRate: entry.hourly_rate ? Number(entry.hourly_rate) : undefined,
        archived: entry.archived || false
      })));

      const newSettings = {
        accentColor: settingsData?.accent_color || defaultSettings.accentColor,
        invoiceMode: settingsData?.invoice_mode || defaultSettings.invoiceMode,
        taskTypes: (taskTypesData || []).length > 0 ? (taskTypesData || []).map(task => ({
          id: task.id,
          name: task.name,
          hourlyRate: task.hourly_rate ? Number(task.hourly_rate) : undefined
        })) : defaultSettings.taskTypes,
        projects: (projectsData || []).length > 0 ? (projectsData || []).map(project => ({
          id: project.id,
          name: project.name,
          clientId: project.client_id || undefined
        })) : defaultSettings.projects,
        clients: (clientsData || []).length > 0 ? (clientsData || []).map(client => ({
          id: client.id,
          name: client.name,
          email: client.email || undefined,
          address: client.address || undefined
        })) : defaultSettings.clients,
        userProfile: {
          name: profileData?.name || '',
          email: profileData?.email || user.email || '',
          phone: profileData?.phone || '',
          address: profileData?.address || '',
          zipCode: profileData?.zip_code || '',
          city: profileData?.city || '',
          state: profileData?.state || ''
        }
      };

      setSettings(newSettings);
      
      // Sync viewMode with invoiceMode setting
      if (newSettings.invoiceMode && viewMode === 'timecard') {
        setViewMode('invoice');
        localStorage.setItem('timeapp-viewmode', 'invoice');
      } else if (!newSettings.invoiceMode && viewMode === 'invoice') {
        setViewMode('timecard');
        localStorage.setItem('timeapp-viewmode', 'timecard');
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        description: "Error loading your data. Please try refreshing.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'submittedAt'>) => {
    if (!user) return;
    
    try {
      const newEntry = {
        user_id: user.id,
        duration: entry.duration,
        task: entry.task,
        project: entry.project,
        client: entry.client || null,
        date: entry.date,
        hourly_rate: entry.hourlyRate || null,
        archived: entry.archived || false
      };

      const { data, error } = await supabase
        .from('time_entries')
        .insert([newEntry])
        .select()
        .single();

      if (error) throw error;

      const transformedEntry: TimeEntry = {
        id: data.id,
        duration: Number(data.duration),
        task: data.task,
        project: data.project,
        client: data.client || '',
        date: data.date,
        submittedAt: data.submitted_at,
        hourlyRate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
        archived: data.archived || false
      };

      setTimeEntries(prev => [transformedEntry, ...prev]);
    } catch (error) {
      console.error('Error adding time entry:', error);
      toast({
        description: "Error saving time entry. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!user) return;
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          accent_color: updatedSettings.accentColor,
          invoice_mode: updatedSettings.invoiceMode
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      setSettings(updatedSettings);
      
      // Update viewMode when invoiceMode setting changes
      if ('invoiceMode' in newSettings) {
        const newViewMode = updatedSettings.invoiceMode ? 'invoice' : 'timecard';
        setViewMode(newViewMode);
        localStorage.setItem('timeapp-viewmode', newViewMode);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        description: "Error saving settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteTimeEntry = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setTimeEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast({
        description: "Error deleting time entry. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateTimeEntry = async (id: string, updates: Partial<TimeEntry>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          duration: updates.duration,
          task: updates.task,
          project: updates.project,
          client: updates.client,
          date: updates.date,
          hourly_rate: updates.hourlyRate,
          archived: updates.archived
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setTimeEntries(prev => prev.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      ));
    } catch (error) {
      console.error('Error updating time entry:', error);
      toast({
        description: "Error updating time entry. Please try again.",
        variant: "destructive"
      });
    }
  };

  const archiveTimeEntries = async (ids: string[]) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ archived: true })
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
      setTimeEntries(prev => prev.map(entry => 
        ids.includes(entry.id) ? { ...entry, archived: true } : entry
      ));
    } catch (error) {
      console.error('Error archiving time entries:', error);
      toast({
        description: "Error archiving time entries. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteTimeEntries = async (ids: string[]) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
      setTimeEntries(prev => prev.filter(entry => !ids.includes(entry.id)));
    } catch (error) {
      console.error('Error deleting time entries:', error);
      toast({
        description: "Error deleting time entries. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#09121F] text-lg">Loading...</div>
      </div>
    );
  }

  const value: AppContextType = {
    timeEntries,
    settings,
    sortOption,
    viewMode,
    loading,
    addTimeEntry,
    updateSettings,
    setSortOption,
    setViewMode: (mode: ViewMode) => {
      setViewMode(mode);
      localStorage.setItem('timeapp-viewmode', mode);
    },
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