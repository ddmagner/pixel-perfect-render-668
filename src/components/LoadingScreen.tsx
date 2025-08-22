import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300),  // Clock appears
      setTimeout(() => setStage(2), 800),  // Clock hands sweep
      setTimeout(() => setStage(3), 1200), // Speech bubbles appear
      setTimeout(() => setStage(4), 1600), // Logo text appears
      setTimeout(() => setStage(5), 2000), // Full reveal
      setTimeout(() => onLoadingComplete(), 2400), // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">
      {/* Clock Animation */}
      <div className="relative">
        {/* Clock Face */}
        <div 
          className={`w-20 h-20 border-4 border-white rounded-full transition-all duration-500 ${
            stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          {/* Hour Hand */}
          <div 
            className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-700 ${
              stage >= 2 ? 'h-6 -translate-x-0.5 -translate-y-6 rotate-[135deg]' : 'h-0 -translate-x-0.5 -translate-y-0'
            }`}
            style={{
              transformOrigin: 'bottom center',
            }}
          />
          
          {/* Minute Hand */}
          <div 
            className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-700 delay-200 ${
              stage >= 2 ? 'h-8 -translate-x-0.5 -translate-y-8 rotate-[270deg]' : 'h-0 -translate-x-0.5 -translate-y-0'
            }`}
            style={{
              transformOrigin: 'bottom center',
            }}
          />

          {/* Center Dot */}
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-0.5 -translate-y-0.5" />
        </div>

        {/* Speech Bubbles */}
        <div className={`absolute -top-8 -left-8 transition-all duration-500 delay-300 ${
          stage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}>
          <svg width="16" height="16" viewBox="0 0 12 12" className="animate-pulse">
            <path 
              d="M5.75 0.5C8.78765 0.5 11.25 2.96235 11.25 6C11.25 9.03765 8.78765 11.5 5.75 11.5C4.8139 11.5 3.93225 11.2663 3.1606 10.8538L0.25 11.5L0.8968 8.5905C0.4843 7.8183 0.25 6.93665 0.25 6C0.25 2.96235 2.71235 0.5 5.75 0.5Z" 
              fill="white"
            />
          </svg>
        </div>

        <div className={`absolute -bottom-6 -right-6 transition-all duration-500 delay-500 ${
          stage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}>
          <svg width="12" height="12" viewBox="0 0 12 12" className="animate-pulse">
            <path 
              d="M5.75 0.5C8.78765 0.5 11.25 2.96235 11.25 6C11.25 9.03765 8.78765 11.5 5.75 11.5C4.8139 11.5 3.93225 11.2663 3.1606 10.8538L0.25 11.5L0.8968 8.5905C0.4843 7.8183 0.25 6.93665 0.25 6C0.25 2.96235 2.71235 0.5 5.75 0.5Z" 
              fill="white"
            />
          </svg>
        </div>

        <div className={`absolute top-0 right-8 transition-all duration-500 delay-700 ${
          stage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}>
          <svg width="8" height="8" viewBox="0 0 12 12" className="animate-pulse">
            <path 
              d="M5.75 0.5C8.78765 0.5 11.25 2.96235 11.25 6C11.25 9.03765 8.78765 11.5 5.75 11.5C4.8139 11.5 3.93225 11.2663 3.1606 10.8538L0.25 11.5L0.8968 8.5905C0.4843 7.8183 0.25 6.93665 0.25 6C0.25 2.96235 2.71235 0.5 5.75 0.5Z" 
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Logo Text */}
      <div className={`absolute bottom-1/3 flex items-center gap-3 transition-all duration-700 ${
        stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <div className="w-[28px] h-[28px] relative overflow-hidden">
          <img 
            src="/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png" 
            alt="Logo" 
            className={`w-full h-full transition-all duration-500 ${
              stage >= 4 ? 'scale-100' : 'scale-0'
            }`}
            style={{
              filter: 'brightness(0) invert(1)', // Make it white
            }}
          />
        </div>
        <div className="w-[182px] relative overflow-hidden">
          <img 
            src="/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png" 
            alt="TIME IN Logo" 
            className={`h-[28px] w-[182px] transition-all duration-700 delay-200 ${
              stage >= 4 ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{
              filter: 'brightness(0) invert(1)', // Make it white
            }}
          />
        </div>
      </div>

      {/* Radial Wipe Effect */}
      <div 
        className={`absolute inset-0 bg-black transition-all duration-1000 ease-out ${
          stage >= 5 ? 'scale-[3] opacity-0' : 'scale-0 opacity-100'
        }`}
        style={{
          clipPath: stage >= 5 ? 'circle(150% at center)' : 'circle(0% at center)',
          transform: 'scale(1)',
        }}
      />

      {/* Sweep Lines */}
      <div className={`absolute inset-0 ${stage >= 2 ? 'animate-ping' : ''}`}>
        <div 
          className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-700 ${
            stage >= 2 ? 'h-screen -translate-x-0.5 -translate-y-screen rotate-45 opacity-20' : 'h-0 opacity-0'
          }`}
        />
        <div 
          className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-700 delay-100 ${
            stage >= 2 ? 'h-screen -translate-x-0.5 -translate-y-screen rotate-[135deg] opacity-20' : 'h-0 opacity-0'
          }`}
        />
        <div 
          className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-700 delay-200 ${
            stage >= 2 ? 'h-screen -translate-x-0.5 -translate-y-screen rotate-[225deg] opacity-20' : 'h-0 opacity-0'
          }`}
        />
        <div 
          className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-700 delay-300 ${
            stage >= 2 ? 'h-screen -translate-x-0.5 -translate-y-screen rotate-[315deg] opacity-20' : 'h-0 opacity-0'
          }`}
        />
      </div>
    </div>
  );
};