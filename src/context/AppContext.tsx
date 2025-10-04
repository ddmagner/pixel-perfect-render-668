import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import { TimeEntry, AppSettings, SortOption, ViewMode, TaxType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  timeEntries: TimeEntry[];
  settings: AppSettings;
  sortOption: SortOption;
  viewMode: ViewMode;
  loading: boolean;
  hasMicrophonePermission: boolean;
  requestMicrophonePermission: () => Promise<boolean>;
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
  taxTypes: [],
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
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [sortOption, setSortOption] = useState<SortOption>('project');
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
      // Avoid prompting for microphone permission on non-interactive routes like the invoice print window
      const isInvoiceWindow = typeof window !== 'undefined' && window.location.pathname === '/invoice';
      if (!isInvoiceWindow && !hasMicrophonePermission) {
        requestMicrophonePermission().then((granted) => {
          if (granted) {
            toast({
              title: "Microphone Access Granted",
              description: "You can now use voice recording features.",
            });
          }
        });
      }
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

      // Load tax types
      const { data: taxTypesData, error: taxTypesError } = await supabase
        .from('tax_types')
        .select('*')
        .eq('user_id', user.id);

      if (taskTypesError) throw taskTypesError;
      if (taxTypesError) throw taxTypesError;

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

      // Load sort option from settings
      const loadedSortOption = (settingsData?.sort_option as SortOption) || 'project';
      setSortOption(loadedSortOption);

      const newSettings = {
        accentColor: settingsData?.accent_color || defaultSettings.accentColor,
        invoiceMode: settingsData?.invoice_mode || defaultSettings.invoiceMode,
        taskTypes: (taskTypesData || []).length > 0 ? (taskTypesData || []).map(task => ({
          id: task.id,
          name: task.name,
          hourlyRate: task.hourly_rate ? Number(task.hourly_rate) : undefined
        })) : defaultSettings.taskTypes,
        taxTypes: (taxTypesData || []).length > 0 ? (taxTypesData || []).map(tax => ({
          id: tax.id,
          name: tax.name,
          rate: tax.rate == null ? undefined : Number(tax.rate)
        })) : defaultSettings.taxTypes,
        projects: (projectsData || []).length > 0 ? (projectsData || []).map(project => ({
          id: project.id,
          name: project.name,
          clientId: project.client_id || undefined
        })) : defaultSettings.projects,
        clients: (clientsData || []).length > 0 ? (clientsData || []).map(client => ({
          id: client.id,
          name: client.name,
          email: client.email || undefined,
          address: client.address || undefined,
          city: client.city || undefined,
          state: client.state || undefined,
          zip_code: client.zip_code || undefined,
          attention: (client as any).attention || undefined
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
      // Find or create task type
      let taskTypeId = null;
      const existingTaskType = settings.taskTypes.find(t => t.name === entry.task);
      
      if (existingTaskType) {
        // Check if task type exists in database
        const { data: dbTaskType } = await supabase
          .from('task_types')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', entry.task)
          .single();
          
        if (dbTaskType) {
          taskTypeId = dbTaskType.id;
        } else {
          // Create task type in database
          const { data: newTaskType } = await supabase
            .from('task_types')
            .insert({
              user_id: user.id,
              name: existingTaskType.name,
              hourly_rate: existingTaskType.hourlyRate || null
            })
            .select('id')
            .single();
          taskTypeId = newTaskType?.id;
        }
      }

      const newEntry = {
        user_id: user.id,
        duration: entry.duration,
        task: entry.task,
        project: entry.project,
        client: entry.client || null,
        date: entry.date,
        hourly_rate: entry.hourlyRate || null,
        archived: entry.archived || false,
        task_type_id: taskTypeId
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
    if (!user) {
      // Update locally when not authenticated
      setSettings(prev => ({ ...prev, ...newSettings }));
      return;
    }
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Sync task types to database if they were updated
      if (newSettings.taskTypes) {
        // Get current task type IDs from database
        const { data: dbTaskTypes } = await supabase
          .from('task_types')
          .select('id')
          .eq('user_id', user.id);
        
        const dbTaskTypeIds = (dbTaskTypes || []).map(t => t.id);
        const newTaskTypeIds = newSettings.taskTypes.map(t => t.id);
        
        // Delete task types that are no longer in the array
        const taskTypesToDelete = dbTaskTypeIds.filter(id => !newTaskTypeIds.includes(id));
        if (taskTypesToDelete.length > 0) {
          await supabase
            .from('task_types')
            .delete()
            .in('id', taskTypesToDelete)
            .eq('user_id', user.id);
        }
        
        // Upsert remaining task types
        for (const taskType of newSettings.taskTypes) {
          await supabase
            .from('task_types')
            .upsert({
              id: taskType.id,
              user_id: user.id,
              name: taskType.name,
              hourly_rate: taskType.hourlyRate || null
            }, {
              onConflict: 'id'
            });
        }
      }

      // Sync tax types to database if they were updated
      if (newSettings.taxTypes) {
        // Get current tax type IDs from database
        const { data: dbTaxTypes } = await supabase
          .from('tax_types')
          .select('id')
          .eq('user_id', user.id);
        
        const dbTaxTypeIds = (dbTaxTypes || []).map(t => t.id);
        const newTaxTypeIds = newSettings.taxTypes.map(t => t.id);
        
        // Delete tax types that are no longer in the array
        const taxTypesToDelete = dbTaxTypeIds.filter(id => !newTaxTypeIds.includes(id));
        if (taxTypesToDelete.length > 0) {
          await supabase
            .from('tax_types')
            .delete()
            .in('id', taxTypesToDelete)
            .eq('user_id', user.id);
        }
        
        // Upsert remaining tax types
        for (const taxType of newSettings.taxTypes) {
          await supabase
            .from('tax_types')
            .upsert({
              id: taxType.id,
              user_id: user.id,
              name: taxType.name,
               rate: taxType.rate == null ? null : taxType.rate
            }, {
              onConflict: 'id'
            });
        }
      }

      // Sync clients to database if they were updated
      if (newSettings.clients) {
        // Get current client IDs from database
        const { data: dbClients } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id);
        
        const dbClientIds = (dbClients || []).map(c => c.id);
        const newClientIds = newSettings.clients.map(c => c.id);
        
        // Delete clients that are no longer in the array
        const clientsToDelete = dbClientIds.filter(id => !newClientIds.includes(id));
        if (clientsToDelete.length > 0) {
          await supabase
            .from('clients')
            .delete()
            .in('id', clientsToDelete)
            .eq('user_id', user.id);
        }
        
        // Upsert remaining clients
        for (const client of newSettings.clients) {
          await supabase
            .from('clients')
            .upsert({
              id: client.id,
              user_id: user.id,
              name: client.name,
              email: client.email || null,
              address: client.address || null,
              city: client.city || null,
              state: client.state || null,
              zip_code: client.zip_code || null,
              attention: client.attention || null
            }, {
              onConflict: 'id'
            });
        }
      }

      // Sync projects to database if they were updated
      if (newSettings.projects) {
        // Get current project IDs from database
        const { data: dbProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id);
        
        const dbProjectIds = (dbProjects || []).map(p => p.id);
        const newProjectIds = newSettings.projects.map(p => p.id);
        
        // Delete projects that are no longer in the array
        const projectsToDelete = dbProjectIds.filter(id => !newProjectIds.includes(id));
        if (projectsToDelete.length > 0) {
          await supabase
            .from('projects')
            .delete()
            .in('id', projectsToDelete)
            .eq('user_id', user.id);
        }
        
        // Upsert remaining projects
        for (const project of newSettings.projects) {
          await supabase
            .from('projects')
            .upsert({
              id: project.id,
              user_id: user.id,
              name: project.name,
              client_id: project.clientId || null
            }, {
              onConflict: 'id'
            });
        }
      }
      
      // Update app settings (including sort_option if it exists in context)
      const { error: settingsError } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          accent_color: updatedSettings.accentColor,
          invoice_mode: updatedSettings.invoiceMode,
          sort_option: sortOption
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) throw settingsError;

      // Update user profile if it was changed
      if (newSettings.userProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            name: updatedSettings.userProfile.name,
            email: updatedSettings.userProfile.email,
            phone: updatedSettings.userProfile.phone,
            address: updatedSettings.userProfile.address,
            zip_code: updatedSettings.userProfile.zipCode,
            city: updatedSettings.userProfile.city,
            state: updatedSettings.userProfile.state
          }, {
            onConflict: 'user_id'
          });

        if (profileError) throw profileError;
      }

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
    hasMicrophonePermission,
    requestMicrophonePermission,
    addTimeEntry,
    updateSettings,
    setSortOption: async (option: SortOption) => {
      setSortOption(option);
      // Save to database
      if (user) {
        try {
          await supabase
            .from('app_settings')
            .upsert({
              user_id: user.id,
              accent_color: settings.accentColor,
              invoice_mode: settings.invoiceMode,
              sort_option: option
            }, {
              onConflict: 'user_id'
            });
        } catch (error) {
          console.error('Error saving sort option:', error);
        }
      }
    },
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