import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseTimeEntryFromSpeech } from '@/utils/speechParser';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
interface TimeEntryData {
  duration: string;
  task: string;
  project: string;
  client: string;
}
interface TimeEntryFormProps {
  onSubmit: (data: TimeEntryData) => void;
  transcript?: string;
}
export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSubmit,
  transcript
}) => {
  const navigate = useNavigate();
  const {
    settings
  } = useApp();
  const { toast } = useToast();
  const { lightImpact, mediumImpact } = useHaptics();
  const [formData, setFormData] = useState<TimeEntryData>({
    duration: '',
    task: '',
    project: '',
    client: ''
  });

  // Parse transcript and update form data
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
          client: parsed.client ? applyInitialCapitalization(parsed.client) : prev.client
        };
        console.log('Updated form data:', newData);
        return newData;
      });
    }
  }, [transcript]);
  const handleSubmit = (e: React.FormEvent) => {
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
      client: ''
    });
  };
  const handleInputChange = (field: keyof TimeEntryData, value: string) => {
    let formattedValue = value;
    
    // Apply initial capitalization for task, project, and client fields
    if (field === 'task' || field === 'project' || field === 'client') {
      formattedValue = value.replace(/\b\w/g, char => char.toUpperCase());
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };
  
  const handleNavigateToSettings = (section: string) => {
    navigate(`/settings?section=${section}`);
  };
  return <section className="flex w-full flex-col items-start px-0 pb-2.5">
      <div className="flex h-px flex-col items-start gap-2.5 w-full px-2.5 py-0" />
      
      <header className="flex h-14 flex-col justify-center items-start gap-14 w-full pt-2.5 px-2.5">
        <h1 className="w-full text-[#09121F] text-[28px] font-bold leading-8 tracking-[-0.56px]">New time in</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col items-start gap-1 w-full">
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
            <input id="task" type="text" placeholder="Doing what?" value={formData.task} onChange={e => handleInputChange('task', e.target.value)} className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]" />
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
            <input id="project" type="text" placeholder="On what?" value={formData.project} onChange={e => handleInputChange('project', e.target.value)} className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]" />
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
            <input id="client" type="text" placeholder="For who?" value={formData.client} onChange={e => handleInputChange('client', e.target.value)} className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]" />
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

        <div className="w-full px-2.5 pt-2.5 pb-1">
          <button type="submit" className="w-full text-white py-3.5 font-bold text-[15px] transition-colors" style={{
          backgroundColor: '#09121F'
        }} aria-label="Add time entry">
            Add Time Entry
          </button>
        </div>
      </form>

      <div className="flex flex-col justify-end items-start w-full">
        <div className="flex h-[34px] justify-center items-center w-full pl-[150px] pr-[151px] pt-5 pb-[9px]">
          <div className="w-[139px] h-[5px] bg-[#09121F] rounded-[100px]" />
        </div>
      </div>
    </section>;
};