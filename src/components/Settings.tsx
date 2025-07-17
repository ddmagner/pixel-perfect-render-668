import React, { useState } from 'react';
import { TimeEntrySettings } from './TimeEntrySettings';
import { UserProfile } from './UserProfile';
import { ColorCustomization } from './ColorCustomization';

type SettingsSection = 'entry-settings' | 'user-profile' | 'coloring';

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('entry-settings');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'entry-settings':
        return <TimeEntrySettings />;
      case 'user-profile':
        return <UserProfile />;
      case 'coloring':
        return <ColorCustomization />;
      default:
        return <TimeEntrySettings />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Settings Header */}
      <header className="flex h-14 flex-col justify-center items-start gap-14 self-stretch pt-2.5 pb-3.5 px-5">
        <h1 className="self-stretch text-[#09121F] text-[28px] font-bold leading-8 tracking-[-0.56px]">
          Settings
        </h1>
      </header>

      {/* Settings Navigation */}
      <nav className="flex flex-col px-5 pb-4">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveSection('entry-settings')}
            className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
              activeSection === 'entry-settings'
                ? 'bg-[#09121F] text-white'
                : 'bg-gray-100 text-[#09121F] hover:bg-gray-200'
            }`}
          >
            <span className="text-[15px] font-bold">Time Entry Settings</span>
          </button>
          
          <button
            onClick={() => setActiveSection('user-profile')}
            className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
              activeSection === 'user-profile'
                ? 'bg-[#09121F] text-white'
                : 'bg-gray-100 text-[#09121F] hover:bg-gray-200'
            }`}
          >
            <span className="text-[15px] font-bold">User Profile</span>
          </button>
          
          <button
            onClick={() => setActiveSection('coloring')}
            className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
              activeSection === 'coloring'
                ? 'bg-[#09121F] text-white'
                : 'bg-gray-100 text-[#09121F] hover:bg-gray-200'
            }`}
          >
            <span className="text-[15px] font-bold">Coloring Time</span>
          </button>
        </div>
      </nav>

      {/* Active Section Content */}
      <div className="flex-1 overflow-y-auto">
        {renderActiveSection()}
      </div>
    </div>
  );
};