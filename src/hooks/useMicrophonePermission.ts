import { useState, useEffect } from 'react';

interface MicrophonePermissionHook {
  hasPermission: boolean;
  isRequesting: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<boolean>;
}

export function useMicrophonePermission(): MicrophonePermissionHook {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if microphone API is supported
  const isSupported = typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;

  const checkPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Microphone access is not supported in this browser');
      return false;
    }

    try {
      // Check permission status
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const granted = permissionStatus.state === 'granted';
      setHasPermission(granted);
      
      if (permissionStatus.state === 'denied') {
        setError('Microphone access was denied. Please enable it in your browser settings.');
      } else {
        setError(null);
      }
      
      return granted;
    } catch (err) {
      // Fallback: try to access microphone directly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        setError(null);
        return true;
      } catch (mediaErr) {
        console.error('Error checking microphone permission:', mediaErr);
        setError('Unable to access microphone. Please check your browser permissions.');
        setHasPermission(false);
        return false;
      }
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Microphone access is not supported in this browser');
      return false;
    }

    setIsRequesting(true);
    setError(null);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Stop the stream immediately since we only need permission
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      console.log('Microphone permission granted');
      return true;
    } catch (err: any) {
      console.error('Error requesting microphone permission:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Microphone access was denied. Please enable it and refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotReadableError') {
        setError('Microphone is already in use by another application.');
      } else {
        setError('Unable to access microphone. Please check your browser settings.');
      }
      
      setHasPermission(false);
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  // Check permission on mount
  useEffect(() => {
    if (isSupported) {
      checkPermission();
    }
  }, [isSupported]);

  return {
    hasPermission,
    isRequesting,
    error,
    requestPermission,
    checkPermission,
  };
}