import React, { useState } from 'react';
import { TimeEntrySettings } from './TimeEntrySettings';
import { UserProfile } from './UserProfile';
import { ColorCustomization } from './ColorCustomization';
import { useApp } from '@/context/AppContext';
import { Clock } from 'lucide-react';
export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings
  } = useApp();
  const [showColorOverlay, setShowColorOverlay] = useState(false);
  const handleModeToggle = () => {
    updateSettings({
      invoiceMode: !settings.invoiceMode
    });
  };
  return <div className="flex flex-col h-full w-full bg-white">
      {/* Mode Toggle */}
      <div className="flex justify-center items-center w-full px-5 py-4">
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${!settings.invoiceMode ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
            Time Card Mode
          </span>
          <button onClick={handleModeToggle} className={`w-12 h-6 rounded-full transition-colors ${settings.invoiceMode ? 'bg-[#09121F]' : 'bg-[#BFBFBF]'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.invoiceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-medium ${settings.invoiceMode ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
            Invoice Mode
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#09121F] mx-5 mb-6" />

      {/* Header */}
      <div className="flex items-baseline justify-between px-5 pt-0.5 pb-1">
        <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Time In settings</h1>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto w-full">
        <TimeEntrySettings />
        <UserProfile />
        
        {/* Coloring Time Section */}
        <div className="px-5 py-4 border-t border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Coloring time</h1>
              <p className="text-[#BFBFBF] text-sm underline cursor-pointer" onClick={() => setShowColorOverlay(true)}>
                Customize the app accent color
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#09121F]" />
            </div>
          </div>
        </div>
      </div>

      {/* Color Overlay */}
      {showColorOverlay && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl animate-slide-in-right">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-[#09121F] text-lg font-bold">Coloring time</h2>
              <button onClick={() => setShowColorOverlay(false)} className="text-[#BFBFBF] text-base font-bold">
                Done
              </button>
            </div>
            <ColorCustomization />
          </div>
        </div>}
    </div>;
};