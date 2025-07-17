import React, { useState } from 'react';

interface TimeEntryData {
  duration: string;
  task: string;
  project: string;
}

interface TimeEntryFormProps {
  onSubmit: (data: TimeEntryData) => void;
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<TimeEntryData>({
    duration: '',
    task: '',
    project: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof TimeEntryData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <section className="flex flex-col items-start flex-[1_0_0] self-stretch px-0 py-2.5">
      <div className="flex h-px flex-col items-start gap-2.5 self-stretch px-5 py-0" />
      
      <header className="flex h-14 flex-col justify-center items-start gap-14 self-stretch pt-2.5 pb-3.5 px-5">
        <h1 className="self-stretch text-[#09121F] text-[28px] font-bold leading-8 tracking-[-0.56px]">
          New time in.
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col items-start gap-2.5 self-stretch">
        <div className="flex flex-col items-start self-stretch">
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <label 
              htmlFor="duration"
              className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px]"
            >
              Duration (hours)
            </label>
          </div>
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <input
              id="duration"
              type="number"
              step="0.25"
              min="0"
              placeholder="How long?"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#09121F]"
              aria-describedby="duration-help"
            />
            <span id="duration-help" className="sr-only">Enter duration in hours</span>
          </div>
        </div>

        <div className="flex flex-col items-start self-stretch">
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <label 
              htmlFor="task"
              className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px] max-sm:text-sm"
            >
              Task
            </label>
          </div>
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <input
              id="task"
              type="text"
              placeholder="Doing what?"
              value={formData.task}
              onChange={(e) => handleInputChange('task', e.target.value)}
              className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#09121F]"
            />
            <button 
              type="button"
              className="text-[#09121F] text-right text-[15px] font-normal leading-5 underline decoration-solid decoration-auto underline-offset-auto"
              aria-label="Add new task"
            >
              + Task
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start self-stretch">
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <label 
              htmlFor="project"
              className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px] max-sm:text-sm"
            >
              Project
            </label>
          </div>
          <div className="flex items-start gap-2.5 self-stretch px-5 py-1.5">
            <input
              id="project"
              type="text"
              placeholder="For which project?"
              value={formData.project}
              onChange={(e) => handleInputChange('project', e.target.value)}
              className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#09121F]"
            />
            <button 
              type="button"
              className="text-[#09121F] text-right text-[15px] font-normal leading-5 underline decoration-solid decoration-auto underline-offset-auto"
              aria-label="Add new project"
            >
              + Project
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start self-stretch pt-[9px]">
          <div className="flex h-14 flex-col items-start gap-2.5 self-stretch px-5 py-[7px] max-md:px-4 max-md:py-[5px] max-sm:px-3 max-sm:py-1">
            <button
              type="submit"
              className="flex items-start flex-[1_0_0] self-stretch bg-[#09121F] px-2 py-1 hover:bg-[#1a1a1a] transition-colors"
              aria-label="Add time entry"
            >
              <span className="flex-[1_0_0] self-stretch text-white text-center text-[15px] font-bold leading-5 tracking-[0.1px]">
                Add Time Entry
              </span>
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-col justify-end items-start self-stretch">
        <div className="flex h-[34px] justify-center items-center self-stretch pl-[150px] pr-[151px] pt-5 pb-[9px]">
          <div className="w-[139px] h-[5px] bg-[#09121F] rounded-[100px]" />
        </div>
      </div>
    </section>
  );
};
