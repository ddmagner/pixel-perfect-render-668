import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Settings } from '@/components/Settings';
import { Navigation } from '@/components/Navigation';
import { ChevronLeft } from 'lucide-react';

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const section = searchParams.get('section');

  const handleBack = () => {
    navigate('/');
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gilroy:wght@400;700;800;900&display=swap"
      />
      <div 
        className="flex w-full flex-col items-start relative bg-white overflow-x-hidden"
        style={{ fontFamily: 'Gilroy, sans-serif' }}
      >
        {/* Navigation with back button */}
        <nav className="flex justify-between items-center self-stretch px-5 pt-4 pb-1 bg-white">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-[#09121F]"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
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
        </nav>
        
        <Settings highlightSection={section} />
      </div>
    </>
  );
};

export default SettingsPage;