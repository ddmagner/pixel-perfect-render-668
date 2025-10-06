import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navigation, TabNavigation } from '@/components/Navigation';
import { Divider } from '@/components/Divider';
import { RecordButton } from '@/components/RecordButton';
import { TimeEntryForm } from '@/components/TimeEntryForm';
import { TimeTally } from '@/components/TimeTally';
import { Settings } from '@/components/Settings';
import { HomeIndicator } from '@/components/HomeIndicator';

import { useApp } from '@/context/AppContext';

const Index = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('activeTab') || 'enter-time';
    } catch {
      return 'enter-time';
    }
  });
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const { timeEntries, addTimeEntry } = useApp();

  // Handle navigation from TimeArchive
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings') {
      setActiveTab('settings');
    }
  }, [searchParams]);

  // Listen for external tab set events (e.g., after export)
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        setActiveTab(e.detail);
        try { localStorage.setItem('activeTab', e.detail); } catch {}
      }
    };
    window.addEventListener('set-active-tab' as any, handler as any);
    return () => window.removeEventListener('set-active-tab' as any, handler as any);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    try { localStorage.setItem('activeTab', tab); } catch {}
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

  const handleFinalTranscript = (transcript: string) => {
    setFinalTranscript(transcript);
  };

  const handleTimeEntrySubmit = (data: { duration: string; task: string; project: string; client: string }) => {
    // Build a local YYYY-MM-DD string to avoid timezone shifts
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    addTimeEntry({
      duration: parseFloat(data.duration) || 0,
      task: data.task,
      project: data.project,
      client: data.client,
      date: localDate,
    });
    console.log('Time entry submitted:', data);
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gilroy:wght@400;700;800;900&display=swap"
      />
      <div className="fixed inset-0 flex flex-col bg-white" style={{ fontFamily: 'Gilroy, sans-serif' }}>
        <div className="sticky top-0 z-40 bg-white" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="w-full max-w-sm mx-auto px-2.5">
            <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
            <Divider />
          </div>
          <div className="h-1" />
        </div>

        <div className={activeTab === 'enter-time' ? 'flex-1 overflow-hidden overflow-x-hidden' : 'flex-1 overflow-y-auto overflow-x-hidden scrollbar-stable'}>
          <div className="w-full max-w-sm mx-auto px-2.5">
            {activeTab === 'enter-time' && (
              <>
                <RecordButton
                  onRecordStart={handleRecordStart}
                  onRecordStop={handleRecordStop}
                  isRecording={isRecording}
                  onTranscript={handleTranscript}
                  onFinalTranscript={handleFinalTranscript}
                />
                
                <Divider />
                
                <TimeEntryForm onSubmit={handleTimeEntrySubmit} transcript={currentTranscript} finalTranscript={finalTranscript} />
              </>
            )}

            {activeTab === 'time-tally' && (
              <TimeTally onSwitchToSettings={() => setActiveTab('settings')} />
            )}

            {activeTab === 'settings' && (
              <Settings />
            )}
          </div>
        </div>

        <HomeIndicator />
      </div>
    </>
  );
};

export default Index;
