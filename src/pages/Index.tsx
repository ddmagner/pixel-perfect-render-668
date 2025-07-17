import React, { useState } from 'react';
import { StatusBar } from '@/components/StatusBar';
import { Navigation, TabNavigation } from '@/components/Navigation';
import { Divider } from '@/components/Divider';
import { RecordButton } from '@/components/RecordButton';
import { TimeEntryForm } from '@/components/TimeEntryForm';
import { TimeTally } from '@/components/TimeTally';
import { Settings } from '@/components/Settings';
import { useApp } from '@/context/AppContext';

const Index = () => {
  const [activeTab, setActiveTab] = useState('enter-time');
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const { timeEntries, addTimeEntry } = useApp();

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

  const handleTranscript = (transcript: string) => {
    setCurrentTranscript(transcript);
  };

  const handleTimeEntrySubmit = (data: { duration: string; task: string; project: string }) => {
    addTimeEntry({
      duration: parseFloat(data.duration) || 0,
      task: data.task,
      project: data.project,
      date: new Date().toISOString().split('T')[0],
    });
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
              onTranscript={handleTranscript}
            />
            
            <Divider />
            
            <TimeEntryForm onSubmit={handleTimeEntrySubmit} transcript={currentTranscript} />
          </>
        )}

        {activeTab === 'time-tally' && (
          <TimeTally />
        )}

        {activeTab === 'settings' && (
          <Settings />
        )}
      </div>
    </>
  );
};

export default Index;
