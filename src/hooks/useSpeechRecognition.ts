import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { getDespiaEnvironment } from '@/hooks/useDespia';
import { SpeechRecognition as CapacitorSpeechRecognition } from '@capacitor-community/speech-recognition';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  finalTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

// Check environment once
const { isNative } = getDespiaEnvironment();

export function useSpeechRecognition(): SpeechRecognitionHook {
  const { hasMicrophonePermission } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isNativeAvailable, setIsNativeAvailable] = useState<boolean | null>(null);
  const webRecognition = useRef<SpeechRecognition | null>(null);

  // Check native speech recognition availability
  useEffect(() => {
    const checkNativeAvailability = async () => {
      if (isNative) {
        try {
          const { available } = await CapacitorSpeechRecognition.available();
          setIsNativeAvailable(available);
        } catch (error) {
          console.debug('Native speech recognition not available:', error);
          setIsNativeAvailable(false);
        }
      } else {
        setIsNativeAvailable(false);
      }
    };
    checkNativeAvailability();
  }, []);

  // Check if Web Speech API is supported
  const isWebSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Overall support check
  const isSupported = (isNativeAvailable === true || (isNativeAvailable === false && isWebSupported)) && hasMicrophonePermission;

  // Initialize Web Speech API (fallback for web)
  useEffect(() => {
    if (isNativeAvailable !== false || !isWebSupported) return;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    webRecognition.current = new SpeechRecognitionAPI();

    webRecognition.current.continuous = true;
    webRecognition.current.interimResults = true;
    webRecognition.current.lang = 'en-US';

    webRecognition.current.onresult = (event: any) => {
      let currentFinalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinalTranscript += transcriptText;
        } else {
          interimTranscript += transcriptText;
        }
      }

      if (currentFinalTranscript) {
        setFinalTranscript(prev => prev + currentFinalTranscript);
      }

      setTranscript(prev => {
        const base = finalTranscript + currentFinalTranscript;
        return base + interimTranscript;
      });
    };

    webRecognition.current.onstart = () => {
      setIsListening(true);
    };

    webRecognition.current.onend = () => {
      setIsListening(false);
    };

    webRecognition.current.onerror = (event: any) => {
      console.error('Web speech recognition error:', event.error);
      setIsListening(false);
    };

    return () => {
      if (webRecognition.current) {
        webRecognition.current.stop();
      }
    };
  }, [isNativeAvailable, isWebSupported, finalTranscript]);

  // Set up native speech recognition listeners
  useEffect(() => {
    if (!isNativeAvailable) return;

    // Listen to partial results from native
    const partialListener = CapacitorSpeechRecognition.addListener('partialResults', (data: any) => {
      if (data.matches && data.matches.length > 0) {
        // Update transcript with partial results
        setTranscript(finalTranscript + data.matches[0]);
      }
    });

    return () => {
      partialListener.then(l => l.remove()).catch(() => {});
    };
  }, [isNativeAvailable, finalTranscript]);

  const startListening = useCallback(async () => {
    if (!hasMicrophonePermission) return;

    if (isNativeAvailable) {
      // Use native speech recognition
      try {
        // Check/request permissions first
        const permissionStatus = await CapacitorSpeechRecognition.checkPermissions();
        if (permissionStatus.speechRecognition !== 'granted') {
          const requestResult = await CapacitorSpeechRecognition.requestPermissions();
          if (requestResult.speechRecognition !== 'granted') {
            console.error('Speech recognition permission denied');
            return;
          }
        }

        setIsListening(true);
        await CapacitorSpeechRecognition.start({
          language: 'en-US',
          partialResults: true,
          popup: false, // Don't show Android popup
        });
      } catch (error) {
        console.error('Native speech recognition error:', error);
        setIsListening(false);
      }
    } else if (webRecognition.current && !isListening) {
      // Fallback to Web Speech API
      webRecognition.current.start();
    }
  }, [hasMicrophonePermission, isNativeAvailable, isListening]);

  const stopListening = useCallback(async () => {
    if (isNativeAvailable) {
      try {
        await CapacitorSpeechRecognition.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping native speech recognition:', error);
        setIsListening(false);
      }
    } else if (webRecognition.current && isListening) {
      webRecognition.current.stop();
    }
  }, [isNativeAvailable, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

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
