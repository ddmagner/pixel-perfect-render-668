import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [stage, setStage] = useState(0);
  const { settings } = useApp();

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 200),  // Clock appears
      setTimeout(() => setStage(2), 500),  // Clock hands fly in
      setTimeout(() => setStage(3), 900),  // Speech bubbles fly in
      setTimeout(() => setStage(4), 1300), // Logo text appears
      setTimeout(() => setStage(5), 1700), // Full reveal
      setTimeout(() => onLoadingComplete(), 2100), // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [onLoadingComplete]);

  const backgroundColor = settings?.accentColor || '#000000';

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor }}
    >
      {/* Clock Animation */}
      <div className="relative">
        {/* Clock Face */}
        <div 
          className={`w-20 h-20 border-4 border-white rounded-full transition-all duration-600 ease-out ${
            stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.3]'
          }`}
        >
          {/* Hour Hand - Flies in from behind camera */}
          <div 
            className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-800 ease-out ${
              stage >= 2 
                ? 'h-6 -translate-x-0.5 -translate-y-6 rotate-[135deg] scale-100' 
                : 'h-6 -translate-x-0.5 -translate-y-6 rotate-[45deg] scale-[0.1] -translate-z-[100px]'
            }`}
            style={{
              transformOrigin: 'bottom center',
              transform: stage >= 2 
                ? 'translateX(-1px) translateY(-24px) rotate(135deg) scale(1)' 
                : 'translateX(-1px) translateY(-24px) rotate(45deg) scale(0.1) translateZ(-100px) rotateX(45deg)'
            }}
          />
          
          {/* Minute Hand - Flies in from behind camera */}
          <div 
            className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-800 ease-out delay-100 ${
              stage >= 2 
                ? 'h-8 -translate-x-0.5 -translate-y-8 rotate-[270deg] scale-100' 
                : 'h-8 -translate-x-0.5 -translate-y-8 rotate-[180deg] scale-[0.1] -translate-z-[100px]'
            }`}
            style={{
              transformOrigin: 'bottom center',
              transform: stage >= 2 
                ? 'translateX(-1px) translateY(-32px) rotate(270deg) scale(1)' 
                : 'translateX(-1px) translateY(-32px) rotate(180deg) scale(0.1) translateZ(-100px) rotateX(45deg)'
            }}
          />

          {/* Center Dot */}
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-0.5 -translate-y-0.5" />
        </div>

        {/* Speech Bubbles - Flying in from behind camera */}
        <div 
          className={`absolute -top-8 -left-8 transition-all duration-700 ease-out delay-200 ${
            stage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.1]'
          }`}
          style={{
            transform: stage >= 3 
              ? 'scale(1) translateZ(0) rotateX(0deg)' 
              : 'scale(0.1) translateZ(-200px) rotateX(60deg) translateY(-50px)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" className="animate-pulse">
            <path 
              d="M5.75 0.5C8.78765 0.5 11.25 2.96235 11.25 6C11.25 9.03765 8.78765 11.5 5.75 11.5C4.8139 11.5 3.93225 11.2663 3.1606 10.8538L0.25 11.5L0.8968 8.5905C0.4843 7.8183 0.25 6.93665 0.25 6C0.25 2.96235 2.71235 0.5 5.75 0.5Z" 
              fill="white"
            />
          </svg>
        </div>

        <div 
          className={`absolute -bottom-6 -right-6 transition-all duration-700 ease-out delay-400 ${
            stage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.1]'
          }`}
          style={{
            transform: stage >= 3 
              ? 'scale(1) translateZ(0) rotateX(0deg)' 
              : 'scale(0.1) translateZ(-200px) rotateX(-60deg) translateY(50px)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="animate-pulse">
            <path 
              d="M5.75 0.5C8.78765 0.5 11.25 2.96235 11.25 6C11.25 9.03765 8.78765 11.5 5.75 11.5C4.8139 11.5 3.93225 11.2663 3.1606 10.8538L0.25 11.5L0.8968 8.5905C0.4843 7.8183 0.25 6.93665 0.25 6C0.25 2.96235 2.71235 0.5 5.75 0.5Z" 
              fill="white"
            />
          </svg>
        </div>

        <div 
          className={`absolute top-0 right-8 transition-all duration-700 ease-out delay-600 ${
            stage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.1]'
          }`}
          style={{
            transform: stage >= 3 
              ? 'scale(1) translateZ(0) rotateX(0deg)' 
              : 'scale(0.1) translateZ(-200px) rotateX(30deg) translateX(30px)'
          }}
        >
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
        <div className="relative overflow-hidden">
          <img 
            src="/time-in-logo.png" 
            alt="Time In Logo" 
            className={`h-[28px] transition-all duration-500 ${
              stage >= 4 ? 'scale-100' : 'scale-0'
            }`}
            style={{
              filter: 'brightness(0) invert(1)', // Make it white
            }}
          />
        </div>
      </div>

      {/* Radial Wipe Effect */}
      <div 
        className={`absolute inset-0 transition-all duration-800 ease-out ${
          stage >= 5 ? 'scale-[3] opacity-0' : 'scale-0 opacity-100'
        }`}
        style={{
          backgroundColor,
          clipPath: stage >= 5 ? 'circle(150% at center)' : 'circle(0% at center)',
          transform: 'scale(1)',
        }}
      />

      {/* Dynamic Sweep Lines */}
      <div className={`absolute inset-0 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div 
          className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-500 ease-out ${
            stage >= 2 ? 'h-screen -translate-x-0.5 -translate-y-screen rotate-45 opacity-10' : 'h-0 opacity-0 rotate-0'
          }`}
        />
        <div 
          className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-500 ease-out delay-75 ${
            stage >= 2 ? 'h-screen -translate-x-0.5 -translate-y-screen rotate-[135deg] opacity-10' : 'h-0 opacity-0 rotate-90'
          }`}
        />
        <div 
          className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-500 ease-out delay-150 ${
            stage >= 2 ? 'h-screen -translate-x-0.5 -translate-y-screen rotate-[225deg] opacity-10' : 'h-0 opacity-0 rotate-180'
          }`}
        />
        <div 
          className={`absolute top-1/2 left-1/2 w-0.5 bg-white origin-bottom transition-all duration-500 ease-out delay-225 ${
            stage >= 2 ? 'h-screen -translate-x-0.5 -translate-y-screen rotate-[315deg] opacity-10' : 'h-0 opacity-0 rotate-270'
          }`}
        />
      </div>
    </div>
  );
};