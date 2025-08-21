import React from 'react';
import { Archive, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TimeArchive: React.FC = () => {
  const navigate = useNavigate();

  const handleViewArchive = () => {
    navigate('/archive');
  };

  return (
    <div className="space-y-4">
      <div 
        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
        onClick={handleViewArchive}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[#09121F]">
            View archive
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-[#09121F]" />
          <ChevronRight className="h-4 w-4 text-[#BFBFBF]" />
        </div>
      </div>
    </div>
  );
};