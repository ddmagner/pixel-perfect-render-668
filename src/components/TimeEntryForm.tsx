import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseTimeEntryFromSpeech } from '@/utils/speechParser';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeEntryData {
  duration: string;
  task: string;
  project: string;
  client: string;
  date: Date;
}
interface TimeEntryFormProps {
  onSubmit: (data: TimeEntryData) => void;
  transcript?: string;
  finalTranscript?: string;
}
export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSubmit,
  transcript,
  finalTranscript
}) => {
  const navigate = useNavigate();
  const {
    settings,
    updateSettings
  } = useApp();
  const { toast } = useToast();
  const { lightImpact, mediumImpact } = useHaptics();
  const [formData, setFormData] = useState<TimeEntryData>({
    duration: '',
    task: '',
    project: '',
    client: '',
    date: new Date()
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse transcript for display (interim + final)
  useEffect(() => {
    if (transcript) {
      console.log('Processing transcript:', transcript);
      const parsed = parseTimeEntryFromSpeech(transcript);
      console.log('Parsed result:', parsed);
      
      // Helper function to apply initial capitalization
      const applyInitialCapitalization = (text: string) => {
        return text.replace(/\b\w/g, char => char.toUpperCase());
      };
      
      setFormData(prev => {
        const newData = {
          duration: parsed.duration !== undefined ? parsed.duration.toString() : prev.duration,
          task: parsed.task ? applyInitialCapitalization(parsed.task) : prev.task,
          project: parsed.project ? applyInitialCapitalization(parsed.project) : prev.project,
          client: parsed.client ? applyInitialCapitalization(parsed.client) : prev.client,
          date: prev.date
        };
        console.log('Updated form data:', newData);
        return newData;
      });
    }
  }, [transcript]);

  // Process final transcript for auto-matching (only when speech is finalized)
  useEffect(() => {
    if (finalTranscript) {
      console.log('Processing final transcript for auto-matching:', finalTranscript);
      const parsed = parseTimeEntryFromSpeech(finalTranscript);
      
      // Only trigger auto-matching when we have finalized speech
      if (parsed.project || parsed.client) {
        setFormData(prev => {
          const newFormData = { ...prev };
          
          if (parsed.project) {
            // Will trigger auto-matching in handleSubmit
            newFormData.project = parsed.project.replace(/\b\w/g, char => char.toUpperCase());
          }
          
          if (parsed.client) {
            // Will trigger auto-matching in handleSubmit
            newFormData.client = parsed.client.replace(/\b\w/g, char => char.toUpperCase());
          }
          
          return newFormData;
        });
      }
    }
  }, [finalTranscript]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all fields have data
    if (!formData.duration.trim() || !formData.task.trim() || !formData.project.trim() || !formData.client.trim()) {
      mediumImpact(); // Error haptic feedback
      toast({
        description: "Please fill in all fields.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Ensure auto-matching is complete for both client and project
      await Promise.all([
        handleClientAutoMatch(formData.client.trim()),
        handleProjectAutoMatch(formData.project.trim())
      ]);
      
      // Wait a moment for the settings to be updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      lightImpact(); // Success haptic feedback
      onSubmit(formData);
      
      // Show toast notification
      toast({
        description: "Time added.",
        duration: 3000,
      });
      
      // Clear form fields
      setFormData({
        duration: '',
        task: '',
        project: '',
        client: '',
        date: new Date()
      });
    } finally {
      setIsProcessing(false);
    }
  };
  const handleInputChange = (field: keyof TimeEntryData, value: string) => {
    let formattedValue = value;
    
    // Apply initial capitalization for task, project, and client fields (without trimming during input)
    if (field === 'task' || field === 'project' || field === 'client') {
      formattedValue = value.replace(/\b\w/g, char => char.toUpperCase());
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleClientAutoMatch = async (clientName: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Check if client already exists
      const existingClient = settings.clients.find(
        client => client.name.toLowerCase() === clientName.toLowerCase()
      );

      if (!existingClient) {
        // Create new client
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            name: clientName,
            user_id: user.user.id
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating client:', error);
          return;
        }

        // Update settings with new client
        const updatedSettings = {
          ...settings,
          clients: [...settings.clients, {
            id: newClient.id,
            name: newClient.name,
            email: newClient.email || undefined,
            address: newClient.address || undefined,
            city: newClient.city || undefined,
            state: newClient.state || undefined,
            zip_code: newClient.zip_code || undefined
          }]
        };
        
        await updateSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error in client auto-match:', error);
    }
  };

  const handleProjectAutoMatch = async (projectName: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Check if project already exists
      const existingProject = settings.projects.find(
        project => project.name.toLowerCase() === projectName.toLowerCase()
      );

      if (!existingProject) {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert({
            name: projectName,
            user_id: user.user.id
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating project:', error);
          return;
        }

        // Update settings with new project
        const updatedSettings = {
          ...settings,
          projects: [...settings.projects, {
            id: newProject.id,
            name: newProject.name,
            clientId: newProject.client_id || undefined
          }]
        };
        
        await updateSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error in project auto-match:', error);
    }
  };
  
  const handleNavigateToSettings = (section: string) => {
    navigate(`/settings?section=${section}`);
  };
  
  return (
    <section className="flex w-full flex-col items-start px-0 pb-2.5">
      <div className="flex h-px flex-col items-start gap-2.5 w-full px-2.5 py-0" />

      <form onSubmit={handleSubmit} className="flex flex-col items-start gap-1 w-full pt-16">
        <div className="flex flex-col items-start w-full">
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <label htmlFor="duration" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px]">
              Duration (hours)
            </label>
          </div>
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <input id="duration" type="text" placeholder="How long?" value={formData.duration} onChange={e => handleInputChange('duration', e.target.value)} className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]" aria-describedby="duration-help" />
            <span id="duration-help" className="sr-only">Enter duration in hours</span>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <label htmlFor="task" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px] max-sm:text-sm">
              Task
            </label>
          </div>
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <AutocompleteInput
              id="task"
              placeholder="Doing what?"
              value={formData.task}
              onChange={(value) => handleInputChange('task', value)}
              suggestions={settings.taskTypes.map(t => t.name)}
            />
            <button 
              type="button" 
              onClick={() => handleNavigateToSettings('tasks')}
              className="text-[#BFBFBF] text-right text-[15px] font-normal leading-5 underline decoration-solid decoration-auto underline-offset-auto" 
              aria-label="Add new task"
            >
              + Task
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <label htmlFor="project" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px] max-sm:text-sm">
              Project
            </label>
          </div>
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <AutocompleteInput
              id="project"
              placeholder="On what?"
              value={formData.project}
              onChange={(value) => handleInputChange('project', value)}
              suggestions={settings.projects.map(p => p.name)}
            />
            <button 
              type="button" 
              onClick={() => handleNavigateToSettings('projects')}
              className="text-[#BFBFBF] text-right text-[15px] font-normal leading-5 underline decoration-solid decoration-auto underline-offset-auto" 
              aria-label="Add new project"
            >
              + Project
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <label htmlFor="client" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px] max-sm:text-sm">
              Client
            </label>
          </div>
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <AutocompleteInput
              id="client"
              placeholder="For who?"
              value={formData.client}
              onChange={(value) => handleInputChange('client', value)}
              suggestions={settings.clients.map(c => c.name)}
            />
            <button 
              type="button" 
              onClick={() => handleNavigateToSettings('clients')}
              className="text-[#BFBFBF] text-right text-[15px] font-normal leading-5 underline decoration-solid decoration-auto underline-offset-auto" 
              aria-label="Add new client"
            >
              + Client
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <label htmlFor="date" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px] max-sm:text-sm">
              Date
            </label>
          </div>
          <div className="flex items-start gap-2.5 w-full px-2.5 py-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex-[1_0_0] justify-start text-left font-normal p-0 h-auto hover:bg-transparent",
                    "text-[#09121F] text-[15px] leading-5 tracking-[0.1px]"
                  )}
                >
                  {format(formData.date, "MM/dd/yy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="w-full px-2.5 pt-2.5 pb-1">
          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full text-white py-3.5 font-bold text-[15px] transition-colors disabled:opacity-70" 
            style={{
              backgroundColor: '#09121F'
            }} 
            aria-label="Add time entry"
          >
            {isProcessing ? 'Adding...' : 'Add Time Entry'}
          </button>
        </div>
      </form>
    </section>
  );
};