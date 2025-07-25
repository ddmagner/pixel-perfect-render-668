import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { settings } = useApp();
  return (
    <nav className="flex justify-center items-center self-stretch bg-white px-5 py-4">
      <div className="flex h-3.5 justify-end items-center">
        <div className="flex items-center gap-[9px]">
          <div>
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="time-icon" style="width: 14px; height: 14px; aspect-ratio: 1/1; fill: ${settings.accentColor}"> <path d="M7 0C10.8661 0 14 3.1339 14 7C14 10.8661 10.8661 14 7 14C5.8086 14 4.6865 13.7025 3.7044 13.1775L0 14L0.8232 10.297C0.2982 9.3142 0 8.1921 0 7C0 3.1339 3.1339 0 7 0ZM7.7 3.5H6.3V8.4H10.5V7H7.7V3.5Z" fill="${settings.accentColor}"></path> </svg>`,
              }}
            />
          </div>
          <div className="w-[91px] self-stretch">
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg width=\"91\" height=\"14\" viewBox=\"0 0 91 14\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"time-in-text\" style=\"display: inline-flex; height: 14px; align-items: center; gap: 13px; width: 91px\"> <path d=\"M51.1992 10.32H56.3992V14H47.1992V0H56.2992V3.64H51.1992V5.16H55.7992V8.76H51.1992V10.32Z\" fill=\"#09121F\"></path> <path d=\"M41.1996 0V14H37.1996V7.18L34.0796 12.42H33.7196L30.5996 7.18V14H26.5996V0H30.5996L33.8996 5.7L37.1996 0H41.1996Z\" fill=\"#09121F\"></path> <path d=\"M16.5996 0H20.5996V14H16.5996V0Z\" fill=\"#09121F\"></path> <path d=\"M10.6 0V3.88H7.3V14H3.3V3.88H0V0H10.6Z\" fill=\"#09121F\"></path> <path d=\"M86.9994 0H90.9994V14H87.7994L83.3994 7.6V14H79.3994V0H82.5994L86.9994 6.4V0Z\" fill=\"#09121F\"></path> <path d=\"M69.3994 0H73.3994V14H69.3994V0Z\" fill=\"#09121F\"></path> </svg>",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const { settings } = useApp();
  return (
    <nav className="flex items-start self-stretch px-5 py-0 pb-0">
      <button
        className={`flex h-12 flex-col justify-center items-center flex-[1_0_0] px-0 py-[9px] relative ${
          activeTab === 'enter-time' ? '' : 'opacity-60'
        }`}
        onClick={() => onTabChange('enter-time')}
        aria-label="Enter Time"
      >
        <div className="flex h-[26px] items-center gap-0.5 shrink-0">
          <div className="w-[24px] h-[24px]">
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg width="24" height="24" viewBox="0 0 27 26" fill="none" xmlns="http://www.w3.org/2000/svg" class="timer-icon" style="display: flex; width: 24px; height: 24px; justify-content: center; align-items: center; flex-shrink: 0; fill: ${activeTab === 'enter-time' ? settings.accentColor : '#BFBFBF'}"> <g clip-path="url(#clip0_551_26125)"> <path d="M19.2527 6.46501L20.8268 4.89092L22.3586 6.42276L20.7845 7.99684C22.3399 9.94377 23.0909 12.4124 22.883 14.8957C22.6752 17.3789 21.5244 19.6884 19.6671 21.3497C17.8097 23.011 15.3867 23.8981 12.8957 23.8288C10.4047 23.7594 8.03479 22.7389 6.2727 20.9768C4.51062 19.2147 3.49012 16.8449 3.42077 14.3539C3.35143 11.8629 4.23851 9.43986 5.89983 7.58248C7.56115 5.72509 9.87061 4.57432 12.3539 4.3665C14.8372 4.15868 17.3058 4.90959 19.2527 6.46501V6.46501ZM13.1665 21.6663C14.1624 21.6663 15.1485 21.4702 16.0685 21.0891C16.9886 20.708 17.8246 20.1494 18.5288 19.4452C19.2329 18.7411 19.7915 17.9051 20.1726 16.985C20.5537 16.065 20.7499 15.0789 20.7499 14.083C20.7499 13.0871 20.5537 12.101 20.1726 11.181C19.7915 10.2609 19.2329 9.42496 18.5288 8.72078C17.8246 8.0166 16.9886 7.45802 16.0685 7.07692C15.1485 6.69582 14.1624 6.49967 13.1665 6.49967C11.1553 6.49967 9.22645 7.29863 7.8043 8.72078C6.38215 10.1429 5.58319 12.0718 5.58319 14.083C5.58319 16.0942 6.38215 18.0231 7.8043 19.4452C9.22645 20.8674 11.1553 21.6663 13.1665 21.6663V21.6663ZM12.0832 8.66634H14.2499V15.1663H12.0832V8.66634ZM8.83319 1.08301H17.4999V3.24967H8.83319V1.08301Z" fill="${activeTab === 'enter-time' ? settings.accentColor : '#BFBFBF'}"></path> </g> <defs> <clipPath id="clip0_551_26125"> <rect width="26" height="26" fill="white" transform="translate(0.166992)"></rect> </clipPath> </defs> </svg>`,
              }}
            />
          </div>
          <span className="text-sm font-bold leading-4" style={{ color: activeTab === 'enter-time' ? settings.accentColor : '#BFBFBF' }}>Enter Time</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: activeTab === 'enter-time' ? settings.accentColor : 'transparent' }} />
      </button>

      <button
        className={`flex h-12 flex-col justify-center items-center flex-[1_0_0] px-0 py-[9px] relative ${
          activeTab === 'time-tally' ? '' : 'opacity-60'
        }`}
        onClick={() => onTabChange('time-tally')}
        aria-label="Time Tally"
      >
        <div className="flex h-[26px] items-center gap-0.5 shrink-0">
          <div className="w-[24px] h-[24px]">
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" class="todo-icon" style="display: flex; width: 22px; height: 22px; justify-content: center; align-items: center; flex-shrink: 0; fill: ${activeTab === 'time-tally' ? settings.accentColor : '#BFBFBF'}"> <g clip-path="url(#clip0_551_26133)"> <path d="M18.2083 2.58333H21.3333C21.6096 2.58333 21.8746 2.69308 22.0699 2.88843C22.2653 3.08378 22.375 3.34873 22.375 3.625V22.375C22.375 22.6513 22.2653 22.9162 22.0699 23.1116C21.8746 23.3069 21.6096 23.4167 21.3333 23.4167H4.66667C4.3904 23.4167 4.12545 23.3069 3.9301 23.1116C3.73475 22.9162 3.625 22.6513 3.625 22.375V3.625C3.625 3.34873 3.73475 3.08378 3.9301 2.88843C4.12545 2.69308 4.3904 2.58333 4.66667 2.58333H7.79167V0.5H9.875V2.58333H16.125V0.5H18.2083V2.58333ZM18.2083 4.66667V6.75H16.125V4.66667H9.875V6.75H7.79167V4.66667H5.70833V21.3333H20.2917V4.66667H18.2083ZM7.79167 8.83333H18.2083V10.9167H7.79167V8.83333ZM7.79167 13H18.2083V15.0833H7.79167V13Z" fill="${activeTab === 'time-tally' ? settings.accentColor : '#BFBFBF'}"></path> </g> <defs> <clipPath id="clip0_551_26133"> <rect width="26" height="26" fill="white" transform="translate(0.5 0.5)"></rect> </clipPath> </defs> </svg>`,
              }}
            />
          </div>
          <span className="text-sm font-bold leading-4" style={{ color: activeTab === 'time-tally' ? settings.accentColor : '#BFBFBF' }}>Time Tally</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: activeTab === 'time-tally' ? settings.accentColor : 'transparent' }} />
      </button>

      <button
        className={`flex h-12 flex-col justify-center items-center flex-[1_0_0] px-0 py-[9px] relative ${
          activeTab === 'settings' ? '' : 'opacity-60'
        }`}
        onClick={() => onTabChange('settings')}
        aria-label="Settings"
      >
        <div className="flex h-[26px] items-center gap-0.5 shrink-0">
          <div className="w-[24px] h-[24px]">
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg width="22" height="22" viewBox="0 0 27 26" fill="none" xmlns="http://www.w3.org/2000/svg" class="settings-icon" style="display: flex; width: 22px; height: 22px; justify-content: center; align-items: center; flex-shrink: 0; fill: ${activeTab === 'settings' ? settings.accentColor : '#BFBFBF'}"> <g clip-path="url(#clip0_551_26138)"> <path d="M13.3337 15.1663V17.333C11.6098 17.333 9.95645 18.0178 8.73747 19.2368C7.51848 20.4558 6.83366 22.1091 6.83366 23.833H4.66699C4.66699 21.5345 5.58008 19.3301 7.2054 17.7047C8.83072 16.0794 11.0351 15.1663 13.3337 15.1663V15.1663ZM13.3337 14.083C9.74241 14.083 6.83366 11.1743 6.83366 7.58301C6.83366 3.99176 9.74241 1.08301 13.3337 1.08301C16.9249 1.08301 19.8337 3.99176 19.8337 7.58301C19.8337 11.1743 16.9249 14.083 13.3337 14.083ZM13.3337 11.9163C15.7278 11.9163 17.667 9.97717 17.667 7.58301C17.667 5.18884 15.7278 3.24967 13.3337 3.24967C10.9395 3.24967 9.00033 5.18884 9.00033 7.58301C9.00033 9.97717 10.9395 11.9163 13.3337 11.9163ZM16.1449 20.3793C16.0075 19.8013 16.0075 19.1991 16.1449 18.6211L15.0702 18.0003L16.1536 16.124L17.2282 16.7448C17.6596 16.3362 18.181 16.0349 18.7503 15.8651V14.6247H20.917V15.8651C21.4933 16.0363 22.0133 16.3418 22.4391 16.7448L23.5137 16.124L24.5971 18.0003L23.5224 18.6211C23.6596 19.1988 23.6596 19.8006 23.5224 20.3783L24.5971 20.999L23.5137 22.8753L22.4391 22.2546C22.0077 22.6631 21.4863 22.9645 20.917 23.1343V24.3747H18.7503V23.1343C18.181 22.9645 17.6596 22.6631 17.2282 22.2546L16.1536 22.8753L15.0702 20.999L16.1449 20.3793V20.3793ZM19.8337 21.1247C20.2646 21.1247 20.678 20.9535 20.9827 20.6487C21.2875 20.344 21.4587 19.9306 21.4587 19.4997C21.4587 19.0687 21.2875 18.6554 20.9827 18.3506C20.678 18.0459 20.2646 17.8747 19.8337 17.8747C19.4027 17.8747 18.9894 18.0459 18.6846 18.3506C18.3799 18.6554 18.2087 19.0687 18.2087 19.4997C18.2087 19.9306 18.3799 20.344 18.6846 20.6487C18.9894 20.9535 19.4027 21.1247 19.8337 21.1247Z" fill="${activeTab === 'settings' ? settings.accentColor : '#BFBFBF'}"></path> </g> <defs> <clipPath id="clip0_551_26138"> <rect width="26" height="26" fill="white" transform="translate(0.333984)"></rect> </clipPath> </defs> </svg>`,
              }}
            />
          </div>
          <span className="text-sm font-bold leading-4" style={{ color: activeTab === 'settings' ? settings.accentColor : '#BFBFBF' }}>Settings</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: activeTab === 'settings' ? settings.accentColor : 'transparent' }} />
      </button>
    </nav>
  );
};