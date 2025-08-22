import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export const WatchMockup: React.FC = () => {
  const { settings } = useApp();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [currentView, setCurrentView] = useState<'timer' | 'recent'>('timer');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const mockEntries = [
    { duration: '2h 30m', task: 'UI Design', project: 'Mobile App', client: 'Acme Corp', time: '2:30 PM' },
    { duration: '1h 15m', task: 'Code Review', project: 'Web Platform', client: 'TechCo', time: '1:15 PM' },
    { duration: '45m', task: 'Meeting', project: 'Strategy', client: 'StartupX', time: '11:30 AM' },
  ];

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <h2 className="text-2xl font-bold text-[#09121F]">Apple Watch Preview</h2>
      
      {/* Watch Frame */}
      <div className="relative">
        {/* Watch Case */}
        <div className="w-[200px] h-[244px] bg-[#1c1c1e] rounded-[50px] shadow-2xl flex items-center justify-center">
          {/* Digital Crown */}
          <div className="absolute -right-1 top-[60px] w-3 h-8 bg-[#8e8e93] rounded-l-lg"></div>
          <div className="absolute -right-1 top-[100px] w-3 h-6 bg-[#8e8e93] rounded-l-lg"></div>
          
          {/* Screen */}
          <div className="w-[176px] h-[220px] bg-[#09121F] rounded-[42px] flex flex-col overflow-hidden">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-3 py-1 text-white text-xs">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <div className="w-4 h-2 border border-white rounded-sm">
                  <div className="w-3 h-1 bg-green-500 rounded-sm"></div>
                </div>
              </div>
            </div>

            {currentView === 'timer' ? (
              /* Timer View */
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
                {/* Timer Display */}
                <div className="text-center mb-4">
                  <div className="text-white text-xl font-mono font-bold">
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {isRunning ? 'Recording...' : 'Ready'}
                  </div>
                </div>

                {/* Main Action Button */}
                <button
                  onClick={() => {
                    setIsRunning(!isRunning);
                    if (!isRunning) setElapsedTime(0);
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all duration-200 ${
                    isRunning 
                      ? 'bg-red-500 scale-110' 
                      : `bg-[${settings.accentColor}] scale-100`
                  }`}
                  style={{
                    backgroundColor: isRunning ? '#ef4444' : settings.accentColor
                  }}
                >
                  {isRunning ? (
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  ) : (
                    <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                  )}
                </button>

                {/* Quick Actions */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setCurrentView('recent')}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="text-gray-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <span className="text-gray-400 text-xs">Recent</span>
                  </button>
                  
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className={isRecording ? 'text-red-500' : 'text-gray-400'}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                      </svg>
                    </div>
                    <span className="text-gray-400 text-xs">Voice</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Recent Entries View */
              <div className="flex-1 flex flex-col px-3 py-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCurrentView('timer')}
                    className="text-blue-400 text-xs"
                  >
                    ← Timer
                  </button>
                  <span className="text-white text-sm font-semibold">Recent</span>
                  <div></div>
                </div>

                {/* Entries List */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {mockEntries.map((entry, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-2">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white text-xs font-semibold">{entry.duration}</span>
                        <span className="text-gray-400 text-xs">{entry.time}</span>
                      </div>
                      <div className="text-white text-xs mb-1 truncate">{entry.task}</div>
                      <div className="text-gray-400 text-xs truncate">
                        {entry.project} • {entry.client}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center max-w-md">
        <p className="text-sm text-gray-600 mb-2">
          This is a mockup of how the Apple Watch app would look. The actual app would be built with SwiftUI and run natively on Apple Watch.
        </p>
        <p className="text-xs text-gray-500">
          Features: Timer tracking, voice recording, recent entries, haptic feedback, and watch face complications.
        </p>
      </div>
    </div>
  );
};