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
      <div
        className="flex w-full max-w-sm mx-auto flex-col items-start relative bg-white min-h-screen"
        style={{ fontFamily: 'Gilroy, sans-serif' }}
      >
        <div className="sticky top-0 z-10 bg-white self-stretch w-full">
          <nav className="flex justify-center items-center self-stretch px-2.5 pt-4 pb-1 bg-white relative">
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
                <div>
                  <img 
                    src="/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png" 
                    alt="Logo" 
                    className="w-[14px] h-[14px]"
                  />
                </div>
                <div className="w-[91px] self-stretch">
                  <img 
                    src="/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png" 
                    alt="TIME IN Logo" 
                    className="h-[14px] w-[91px]"
                  />
                </div>
              </div>
            </div>
          </nav>
          <Divider />
          <div className="h-2" />
        </div>
        <div className="-mt-2 self-stretch w-full">
          <Settings highlightSection={section} />
        </div>
        
        <HomeIndicator />
      </div>
    </>
  );
};

export default SettingsPage;