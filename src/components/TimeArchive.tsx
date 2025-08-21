import React from 'react';
import { Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export const TimeArchive: React.FC = () => {
  const navigate = useNavigate();
  const handleViewArchive = () => {
    navigate('/archive');
  };
  return <div className="space-y-4">
      <div 
        className="flex items-center justify-between cursor-pointer py-2 rounded-lg transition-colors" 
        onClick={handleViewArchive}
      >
        <h1 className="text-[#09121F] text-[28px] font-bold leading-8">Time archive</h1>
        <p className="text-[#09121F] text-sm">View</p>
      </div>
    </div>;
};