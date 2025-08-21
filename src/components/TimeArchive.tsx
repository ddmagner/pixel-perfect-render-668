import React from 'react';
import { Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';

export const TimeArchive: React.FC = () => {
  const navigate = useNavigate();
  const { timeEntries } = useApp();
  
  const archivedEntries = timeEntries.filter(entry => entry.archived);
  const archivedCount = archivedEntries.length;
  
  const handleViewArchive = () => {
    navigate('/archive');
  };

  return (
    <div className="flex flex-col h-full w-full font-gilroy">
      {/* Header */}
      <div className="pt-0.5 pb-1 h-[2.75rem] px-5">
        <div className="flex items-baseline justify-between h-full">
          <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Time archive</h1>
          <Archive className="h-5 w-5 text-[#09121F]" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#09121F] mx-5 mb-6" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full px-5">
        <div className="text-center py-8">
          <Archive className="h-12 w-12 mx-auto mb-4 text-[#BFBFBF]" />
          <h2 className="text-[#09121F] text-xl font-semibold mb-2">
            {archivedCount > 0 ? `${archivedCount} archived entries` : 'No archived entries'}
          </h2>
          <p className="text-[#BFBFBF] text-sm mb-6">
            {archivedCount > 0 
              ? 'View and manage your archived time entries'
              : 'Time entries you archive will appear here'
            }
          </p>
          
          {archivedCount > 0 && (
            <Button 
              onClick={handleViewArchive}
              className="bg-[#09121F] text-white hover:bg-[#09121F]/90"
            >
              View Archive
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};