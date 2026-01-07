import { useState, useEffect, useCallback } from 'react';
import despia from 'despia-native';
import { useDespia } from './useDespia';

interface BiometricAuthState {
  isAvailable: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
}

declare global {
  interface Window {
    onBioAuthSuccess: () => void;
    onBioAuthFailure: (errorCode: string, errorMessage: string) => void;
    onBioAuthUnavailable: () => void;
  }
}

export function useBiometricAuth() {
  const { isDespia } = useDespia();
  
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    isAuthenticated: false,
    isAuthenticating: false,
    error: null,
  });

  useEffect(() => {
    if (!isDespia) {
      return;
    }

    // Set up global callback functions for Despia runtime
    window.onBioAuthSuccess = () => {
      console.log('Biometric authentication successful');
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        isAuthenticating: false,
        error: null,
      }));
    };

    window.onBioAuthFailure = (errorCode: string, errorMessage: string) => {
      console.log('Biometric authentication failed:', errorCode, errorMessage);
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isAuthenticating: false,
        error: errorMessage || 'Authentication failed',
      }));
    };

    window.onBioAuthUnavailable = () => {
      console.log('Biometric authentication unavailable');
      setState(prev => ({
        ...prev,
        isAvailable: false,
        isAuthenticating: false,
        error: 'Biometric authentication is not available on this device',
      }));
    };

    // Mark biometrics as available in Despia environment
    setState(prev => ({ ...prev, isAvailable: true }));

    return () => {
      // Cleanup global callbacks
      delete window.onBioAuthSuccess;
      delete window.onBioAuthFailure;
      delete window.onBioAuthUnavailable;
    };
  }, [isDespia]);

  const authenticate = useCallback(() => {
    if (!isDespia) {
      setState(prev => ({
        ...prev,
        error: 'Biometric authentication is only available in the native app',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isAuthenticating: true,
      error: null,
    }));

    // Trigger biometric authentication
    despia('bioauth://');
  }, [isDespia]);

  const reset = useCallback(() => {
    setState({
      isAvailable: isDespia,
      isAuthenticated: false,
      isAuthenticating: false,
      error: null,
    });
  }, [isDespia]);

  return {
    ...state,
    authenticate,
    reset,
    isDespiaNative: isDespia,
  };
}
