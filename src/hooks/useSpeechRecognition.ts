import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  finalTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const { hasMicrophonePermission } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const recognition = useRef<SpeechRecognition | null>(null);

  // Check if speech recognition is supported and we have microphone permission
  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
    hasMicrophonePermission;

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();

    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.lang = 'en-US';

    recognition.current.onresult = (event: any) => {
      let currentFinalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update the final transcript when we have finalized speech
      if (currentFinalTranscript) {
        setFinalTranscript(prev => prev + currentFinalTranscript);
      }

      // Show both final and interim for UI display
      setTranscript(finalTranscript + currentFinalTranscript + interimTranscript);
    };

    recognition.current.onstart = () => {
      setIsListening(true);
    };

    recognition.current.onend = () => {
      setIsListening(false);
    };

    recognition.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, [isSupported]);

  const startListening = () => {
    if (recognition.current && !isListening && hasMicrophonePermission) {
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setFinalTranscript('');
  };

  return {
    isListening,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
}