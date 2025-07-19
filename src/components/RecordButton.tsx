import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useApp } from '@/context/AppContext';

interface RecordButtonProps {
  onRecordStart: () => void;
  onRecordStop: () => void;
  isRecording: boolean;
  onTranscript: (transcript: string) => void;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ 
  onRecordStart, 
  onRecordStop, 
  isRecording,
  onTranscript 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { settings } = useApp();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  const handleMouseDown = () => {
    setIsPressed(true);
    onRecordStart();
    if (isSupported) {
      resetTranscript();
      startListening();
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    onRecordStop();
    if (isSupported) {
      stopListening();
    }
  };

  const handleTouchStart = () => {
    setIsPressed(true);
    onRecordStart();
    if (isSupported) {
      resetTranscript();
      startListening();
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    onRecordStop();
    if (isSupported) {
      stopListening();
    }
  };

  return (
    <section className="flex w-full justify-center items-center gap-2.5 px-0 py-[50px]">
      <div className="flex flex-col items-center gap-10 shrink-0">
        <div className="h-[220px] w-[220px] relative max-sm:h-[180px] max-sm:w-[180px]">
          <div>
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg width="220" height="221" viewBox="0 0 220 221" fill="none" xmlns="http://www.w3.org/2000/svg" class="record-button-bg max-sm:w-[180px] max-sm:h-[180px]" style="width: 220px; height: 220px; flex-shrink: 0;"> <path d="M110 0.5C170.753 0.5 220 49.747 220 110.5C220 171.253 170.753 220.5 110 220.5C91.278 220.5 73.645 215.825 58.212 207.575L0 220.5L12.936 162.31C4.686 146.866 0 129.233 0 110.5C0 49.747 49.247 0.5 110 0.5Z" fill="${isPressed ? '#BFBFBF' : 'white'}"></path> </svg>`,
              }}
            />
          </div>
          <button
            className={`w-[220px] h-[220px] shrink-0 absolute left-0 top-0 max-sm:w-[180px] max-sm:h-[180px] transition-all flex items-center justify-center rounded-full ${
              isPressed ? 'scale-95 bg-[#BFBFBF]' : 'scale-100 bg-white'
            } ${isRecording ? 'animate-pulse' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            aria-label="Hold to record voice note"
            role="button"
          >
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    "<svg width=\"220\" height=\"221\" viewBox=\"0 0 220 221\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"record-button-border max-sm:w-[180px] max-sm:h-[180px]\" style=\"width: 220px; height: 220px; flex-shrink: 0; fill: #09121F\"> <path d=\"M110 0.5C170.753 0.5 220 49.747 220 110.5C220 171.253 170.753 220.5 110 220.5C91.278 220.5 73.645 215.825 58.212 207.575L0 220.5L12.936 162.31C4.686 146.866 0 129.233 0 110.5C0 49.747 49.247 0.5 110 0.5ZM110 22.5C61.402 22.5 22 61.902 22 110.5C22 125.185 25.586 139.298 32.34 151.926L36.19 159.12L28.974 191.526L61.402 184.332L68.585 188.171C81.213 194.925 95.315 198.5 110 198.5C158.598 198.5 198 159.098 198 110.5C198 61.902 158.598 22.5 110 22.5Z\" fill=\"#09121F\"></path> </svg>",
                }}
              />
            </div>
            <div className="flex flex-col items-center gap-0.5 absolute">
              <div>
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      "<svg width=\"29\" height=\"29\" viewBox=\"0 0 29 29\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"mic-icon\" style=\"display: flex; width: 28px; height: 28px; justify-content: center; align-items: center; aspect-ratio: 1/1; fill: #09121F\"> <g clip-path=\"url(#clip0_591_27312)\"> <path d=\"M14.2669 4.00033C13.3386 4.00033 12.4484 4.36907 11.792 5.02545C11.1356 5.68183 10.7669 6.57207 10.7669 7.50033V12.167C10.7669 13.0953 11.1356 13.9855 11.792 14.6419C12.4484 15.2982 13.3386 15.667 14.2669 15.667C15.1951 15.667 16.0854 15.2982 16.7418 14.6419C17.3981 13.9855 17.7669 13.0953 17.7669 12.167V7.50033C17.7669 6.57207 17.3981 5.68183 16.7418 5.02545C16.0854 4.36907 15.1951 4.00033 14.2669 4.00033ZM14.2669 1.66699C15.0329 1.66699 15.7915 1.81788 16.4992 2.11103C17.2069 2.40418 17.85 2.83386 18.3917 3.37554C18.9334 3.91721 19.363 4.56027 19.6562 5.26801C19.9493 5.97574 20.1002 6.73428 20.1002 7.50033V12.167C20.1002 13.7141 19.4856 15.1978 18.3917 16.2918C17.2977 17.3857 15.814 18.0003 14.2669 18.0003C12.7198 18.0003 11.2361 17.3857 10.1421 16.2918C9.04814 15.1978 8.43356 13.7141 8.43356 12.167V7.50033C8.43356 5.95323 9.04814 4.4695 10.1421 3.37554C11.2361 2.28157 12.7198 1.66699 14.2669 1.66699ZM3.83105 13.3337H6.18189C6.46456 15.2759 7.43707 17.0515 8.92149 18.3355C10.4059 19.6195 12.303 20.3261 14.2657 20.3261C16.2284 20.3261 18.1255 19.6195 19.61 18.3355C21.0944 17.0515 22.0669 15.2759 22.3496 13.3337H24.7016C24.4363 15.7005 23.3746 17.9069 21.6906 19.5911C20.0067 21.2753 17.8004 22.3373 15.4336 22.6028V27.3337H13.1002V22.6028C10.7332 22.3375 8.52664 21.2757 6.84243 19.5915C5.15822 17.9072 4.09637 15.7007 3.83105 13.3337Z\" fill=\"#09121F\"></path> </g> <defs> <clipPath id=\"clip0_591_27312\"> <rect width=\"28\" height=\"28\" fill=\"white\" transform=\"translate(0.266602 0.5)\"></rect> </clipPath> </defs> </svg>",
                  }}
                />
              </div>
              <span className="text-[#09121F] text-center text-base font-bold leading-[18px] whitespace-nowrap">
                Hold to Record
              </span>
            </div>
          </button>
        </div>
        <div className="flex items-center justify-center whitespace-nowrap w-full">
          <div className="flex items-center">
            <span className="text-[#09121F] text-[15px] italic font-extrabold leading-[15px] tracking-[0.2px]">
              "
            </span>
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" class="speech-bubble-1" style="width: 12px; height: 12px; aspect-ratio: 1/1; fill: #FF4015; margin: 0 2px;"> <path d="M5.75 0.5C8.78765 0.5 11.25 2.96235 11.25 6C11.25 9.03765 8.78765 11.5 5.75 11.5C4.8139 11.5 3.93225 11.2663 3.1606 10.8538L0.25 11.5L0.8968 8.5905C0.4843 7.8183 0.25 6.93665 0.25 6C0.25 2.96235 2.71235 0.5 5.75 0.5Z" fill="#FF4015"></path> </svg>`,
              }}
            />
          </div>
          <span className="text-[#09121F] text-[15px] italic font-black leading-[15px] tracking-[0.2px] mx-0.5">
            hours in...doing
          </span>
          <div
            className="w-fit"
            dangerouslySetInnerHTML={{
              __html: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" class="speech-bubble-2" style="width: 12px; height: 12px; aspect-ratio: 1/1; fill: #FF4015; margin: 0 2px;"> <path d="M5.75 0.5C8.78765 0.5 11.25 2.96235 11.25 6C11.25 9.03765 8.78765 11.5 5.75 11.5C4.8139 11.5 3.93225 11.2663 3.1606 10.8538L0.25 11.5L0.8968 8.5905C0.4843 7.8183 0.25 6.93665 0.25 6C0.25 2.96235 2.71235 0.5 5.75 0.5Z" fill="#FF4015"></path> </svg>`,
            }}
          />
          <span className="text-[#09121F] text-[15px] italic font-black leading-[15px] tracking-[0.2px] mr-0.5">
            ...on
          </span>
          <div className="flex items-center">
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" class="speech-bubble-3" style="width: 12px; height: 12px; aspect-ratio: 1/1; fill: #FF4015; margin: 0 2px;"> <path d="M5.75 0.5C8.78765 0.5 11.25 2.96235 11.25 6C11.25 9.03765 8.78765 11.5 5.75 11.5C4.8139 11.5 3.93225 11.2663 3.1606 10.8538L0.25 11.5L0.8968 8.5905C0.4843 7.8183 0.25 6.93665 0.25 6C0.25 2.96235 2.71235 0.5 5.75 0.5Z" fill="#FF4015"></path> </svg>`,
              }}
            />
            <span className="text-[#09121F] text-[15px] italic font-black leading-[15px] tracking-[0.2px]">
              "
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};