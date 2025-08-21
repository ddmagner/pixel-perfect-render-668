import React from 'react';
import { Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TimeArchive: React.FC = () => {
  const navigate = useNavigate();

  const handleViewArchive = () => {
    navigate('/archive');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[#09121F] text-[28px] font-bold leading-8">
          View archive
        </h1>
        <Archive className="h-5 w-5 text-[#09121F]" />
      </div>
    </div>
  );
};