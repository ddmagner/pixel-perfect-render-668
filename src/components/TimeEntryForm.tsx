import React, { useState, useEffect } from 'react';
import { parseTimeEntryFromSpeech } from '@/utils/speechParser';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
interface TimeEntryData {
  duration: string;
  task: string;
  project: string;
}
interface TimeEntryFormProps {
  onSubmit: (data: TimeEntryData) => void;
  transcript?: string;
}
export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSubmit,
  transcript
}) => {
  const {
    settings
  } = useApp();
  const { toast } = useToast();
  const [formData, setFormData] = useState<TimeEntryData>({
    duration: '',
    task: '',
    project: ''
  });

  // Parse transcript and update form data
  useEffect(() => {
    if (transcript) {
      const parsed = parseTimeEntryFromSpeech(transcript);
      setFormData(prev => ({
        duration: parsed.duration ? parsed.duration.toString() : prev.duration,
        task: parsed.task || prev.task,
        project: parsed.project || prev.project
      }));
    }
  }, [transcript]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all fields have data
    if (!formData.duration.trim() || !formData.task.trim() || !formData.project.trim()) {
      toast({
        description: "Please fill in all fields.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
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
      project: ''
    });
  };
  const handleInputChange = (field: keyof TimeEntryData, value: string) => {
    let formattedValue = value;
    
    // Apply initial capitalization for task and project fields
    if (field === 'task' || field === 'project') {
      formattedValue = value.replace(/\b\w/g, char => char.toUpperCase());
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };
  return <section className="flex flex-col items-start flex-[1_0_0] self-stretch px-0 py-2.5">
      <div className="flex h-px flex-col items-start gap-2.5 self-stretch px-5 py-0" />
      
      <header className="flex h-14 flex-col justify-center items-start gap-14 self-stretch pt-2.5 px-5">
        <h1 className="self-stretch text-[#09121F] text-[28px] font-bold leading-8 tracking-[-0.56px]">New time in</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col items-start gap-2.5 self-stretch">
        <div className="flex flex-col items-start self-stretch">
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <label htmlFor="duration" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px]">
              Duration (hours)
            </label>
          </div>
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <input id="duration" type="text" placeholder="How long?" value={formData.duration} onChange={e => handleInputChange('duration', e.target.value)} className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]" aria-describedby="duration-help" />
            <span id="duration-help" className="sr-only">Enter duration in hours</span>
          </div>
        </div>

        <div className="flex flex-col items-start self-stretch">
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <label htmlFor="task" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px] max-sm:text-sm">
              Task
            </label>
          </div>
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <input id="task" type="text" placeholder="Doing what?" value={formData.task} onChange={e => handleInputChange('task', e.target.value)} className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]" />
            <button type="button" className="text-[#BFBFBF] text-right text-[15px] font-normal leading-5 underline decoration-solid decoration-auto underline-offset-auto" aria-label="Add new task">
              + Task
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start self-stretch">
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <label htmlFor="project" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px] max-sm:text-sm">
              Project
            </label>
          </div>
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <input id="project" type="text" placeholder="On what?" value={formData.project} onChange={e => handleInputChange('project', e.target.value)} className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]" />
            <button type="button" className="text-[#BFBFBF] text-right text-[15px] font-normal leading-5 underline decoration-solid decoration-auto underline-offset-auto" aria-label="Add new project">
              + Project
            </button>
          </div>
        </div>

        <div className="w-full px-5 py-5">
          <button type="submit" className="w-full text-white py-3.5 font-bold text-[15px] transition-colors" style={{
          backgroundColor: '#09121F'
        }} aria-label="Add time entry">
            Add Time Entry
          </button>
        </div>
      </form>

      <div className="flex flex-col justify-end items-start self-stretch">
        <div className="flex h-[34px] justify-center items-center self-stretch pl-[150px] pr-[151px] pt-5 pb-[9px]">
          <div className="w-[139px] h-[5px] bg-[#09121F] rounded-[100px]" />
        </div>
      </div>
    </section>;
};