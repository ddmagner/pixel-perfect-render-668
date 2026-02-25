import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Settings } from '@/components/Settings';
import { Navigation } from '@/components/Navigation';
import { ChevronLeft } from 'lucide-react';
import { HomeIndicator } from '@/components/HomeIndicator';
import { Divider } from '@/components/Divider';

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const section = searchParams.get('section');

  const handleBack = () => {
    navigate('/');
  };

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-white">
        <div className="sticky top-0 z-40 bg-white" style={{ paddingTop: 'var(--safe-area-top, 0px)' }}>
          <div className="w-full max-w-sm mx-auto px-2.5">
            <nav className="flex justify-center items-center self-stretch pb-0 bg-white relative">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-[#09121F] absolute left-2.5"
                aria-label="Go back"
              >
                <ChevronLeft size={20} />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="flex h-3.5 justify-end items-center">
                <div className="flex items-center gap-[9px]">
                  <img 
                    src="/time-in-logo.png" 
                    alt="Time In Logo" 
                    className="h-[14px]"
                  />
                </div>
              </div>
              <span className="absolute right-2.5 text-[10px] leading-none text-gray-500">v1.0.3 • LIVE</span>
            </nav>
            <Divider />
            
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-sm mx-auto px-2.5">
            <Settings highlightSection={section} />
          </div>
        </div>
        
        {/* Safe area bottom spacer */}
        <div style={{ height: 'var(--safe-area-bottom, 0px)', flexShrink: 0 }} />
        <HomeIndicator />
      </div>
    </>
  );
};

export default SettingsPage;