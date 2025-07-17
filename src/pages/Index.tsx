import React, { useState } from 'react';
import { StatusBar } from '@/components/StatusBar';
import { Navigation, TabNavigation } from '@/components/Navigation';
import { Divider } from '@/components/Divider';
import { RecordButton } from '@/components/RecordButton';
import { TimeEntryForm } from '@/components/TimeEntryForm';

interface TimeEntryData {
  duration: string;
  task: string;
  project: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('enter-time');
  const [isRecording, setIsRecording] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntryData[]>([]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleRecordStart = () => {
    setIsRecording(true);
    console.log('Recording started');
  };

  const handleRecordStop = () => {
    setIsRecording(false);
    console.log('Recording stopped');
  };

  const handleTimeEntrySubmit = (data: TimeEntryData) => {
    setTimeEntries(prev => [...prev, data]);
    console.log('Time entry submitted:', data);
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gilroy:wght@400;700;800;900&display=swap"
      />
      <div 
        className="flex w-full max-w-[440px] min-h-[956px] flex-col items-start relative bg-white mx-auto my-0"
        style={{ fontFamily: 'Gilroy, sans-serif' }}
      >
        <StatusBar />
        
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
        
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        
        <Divider />
        
        {activeTab === 'enter-time' && (
          <>
            <RecordButton
              onRecordStart={handleRecordStart}
              onRecordStop={handleRecordStop}
              isRecording={isRecording}
            />
            
            <Divider />
            
            <TimeEntryForm onSubmit={handleTimeEntrySubmit} />
          </>
        )}

        {activeTab === 'time-tally' && (
          <main className="flex flex-col items-center justify-center flex-1 self-stretch px-5 py-10">
            <h2 className="text-[#09121F] text-2xl font-bold mb-4">Time Tally</h2>
            <p className="text-[#BFBFBF] text-center">
              View your recorded time entries and daily summaries here.
            </p>
            {timeEntries.length > 0 && (
              <div className="mt-6 w-full">
                <h3 className="text-[#09121F] text-lg font-bold mb-3">Recent Entries:</h3>
                {timeEntries.map((entry, index) => (
                  <div key={index} className="bg-gray-50 p-3 mb-2 rounded">
                    <p><strong>Duration:</strong> {entry.duration} hours</p>
                    <p><strong>Task:</strong> {entry.task}</p>
                    <p><strong>Project:</strong> {entry.project}</p>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {activeTab === 'settings' && (
          <main className="flex flex-col items-center justify-center flex-1 self-stretch px-5 py-10">
            <h2 className="text-[#09121F] text-2xl font-bold mb-4">Settings</h2>
            <p className="text-[#BFBFBF] text-center">
              Configure your time tracking preferences and account settings.
            </p>
          </main>
        )}
      </div>
    </>
  );
};

export default Index;
