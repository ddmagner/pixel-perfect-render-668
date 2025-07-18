import React, { useState } from 'react';
import { TimeEntrySettings } from './TimeEntrySettings';
import { UserProfile } from './UserProfile';
import { ColorCustomization } from './ColorCustomization';
import { useApp } from '@/context/AppContext';
import { Clock } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [showColorOverlay, setShowColorOverlay] = useState(false);

  const handleModeToggle = () => {
    updateSettings({
      invoiceMode: !settings.invoiceMode,
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Mode Toggle */}
      <div className="flex justify-center items-center w-full px-5 py-4">
        <div className="flex items-center gap-4">
          <span className={`text-[15px] font-medium ${!settings.invoiceMode ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
            Time Card Mode
          </span>
          <button
            onClick={handleModeToggle}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.invoiceMode ? 'bg-[#09121F]' : 'bg-[#BFBFBF]'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.invoiceMode ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-[15px] font-medium ${settings.invoiceMode ? 'text-[#09121F]' : 'text-[#BFBFBF]'}`}>
            Invoice Mode
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#09121F] mx-5 mb-6" />

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <TimeEntrySettings />
        <UserProfile />
        
        {/* Coloring Time Section */}
        <div className="px-5 pt-6">
          <div className="h-px bg-[#09121F] mx-5 mb-6" />
          <button
            onClick={() => setShowColorOverlay(true)}
            className="flex items-center gap-4 w-full py-4"
          >
            <div className="w-12 h-12 bg-[#F5F5F5] rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#09121F]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[#09121F] text-[18px] font-bold">Coloring time</h3>
              <p className="text-[#BFBFBF] text-sm">Customize the app accent color</p>
            </div>
          </button>
        </div>
      </div>

      {/* Color Overlay */}
      {showColorOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-[390px] max-w-full mx-auto rounded-t-2xl animate-slide-in-right">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-[#09121F] text-[18px] font-bold">Coloring time</h2>
              <button
                onClick={() => setShowColorOverlay(false)}
                className="text-[#BFBFBF] text-[16px] font-bold"
              >
                Done
              </button>
            </div>
            <ColorCustomization />
          </div>
        </div>
      )}
    </div>
  );
};