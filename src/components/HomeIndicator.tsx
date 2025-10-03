import React from 'react';
import { Capacitor } from '@capacitor/core';

export const HomeIndicator = () => {
  // Hide the home indicator when running as a native app
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    return null;
  }

  return (
    <div className="flex flex-col justify-end items-start w-full">
      <div className="flex h-[34px] justify-center items-center w-full pl-[150px] pr-[151px] pt-5 pb-[9px]">
        <div className="w-[139px] h-[5px] bg-[#09121F] rounded-[100px]" />
      </div>
    </div>
  );
};
