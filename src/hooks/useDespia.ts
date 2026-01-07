import { useMemo, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import despia from 'despia-native';

export type Platform = 'despia-ios' | 'despia-android' | 'despia' | 'ios' | 'android' | 'web';

export interface DespiaEnvironment {
  isDespia: boolean;
  isDespiaIOS: boolean;
  isDespiaAndroid: boolean;
  isNative: boolean;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  platform: Platform;
}

export interface UseDespia extends DespiaEnvironment {
  // Haptic feedback
  lightHaptic: () => void;
  heavyHaptic: () => void;
  successHaptic: () => void;
  warningHaptic: () => void;
  errorHaptic: () => void;
  
  // Utility methods
  call: (endpoint: string, returnKeys?: string[]) => Promise<any>;
  webVibrate: (pattern: number | number[]) => boolean;
}

// Static detection (runs once at module load)
const detectEnvironment = (): DespiaEnvironment => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  
  const isDespia = ua.includes('despia');
  const isDespiaIOS = isDespia && (ua.includes('iphone') || ua.includes('ipad'));
  const isDespiaAndroid = isDespia && ua.includes('android');
  
  const isCapacitorNative = Capacitor.isNativePlatform();
  const capacitorPlatform = isCapacitorNative ? Capacitor.getPlatform() : null;
  
  const isNative = isDespia || isCapacitorNative;
  const isWeb = !isNative;
  const isIOS = isDespiaIOS || capacitorPlatform === 'ios';
  const isAndroid = isDespiaAndroid || capacitorPlatform === 'android';
  
  let platform: Platform = 'web';
  if (isDespiaIOS) {
    platform = 'despia-ios';
  } else if (isDespiaAndroid) {
    platform = 'despia-android';
  } else if (isDespia) {
    platform = 'despia';
  } else if (capacitorPlatform === 'ios') {
    platform = 'ios';
  } else if (capacitorPlatform === 'android') {
    platform = 'android';
  }
  
  return { isDespia, isDespiaIOS, isDespiaAndroid, isNative, isWeb, isIOS, isAndroid, platform };
};

// Cached environment detection
const environment = detectEnvironment();

/**
 * Centralized hook for Despia environment detection and native feature access.
 * Provides environment flags and helper methods for calling Despia features with automatic fallbacks.
 */
export const useDespia = (): UseDespia => {
  // Web vibration fallback
  const webVibrate = useCallback((pattern: number | number[]): boolean => {
    if ('vibrate' in navigator) {
      try {
        return navigator.vibrate(pattern) ?? false;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Generic call method for Despia endpoints
  const call = useCallback(async (endpoint: string, returnKeys?: string[]): Promise<any> => {
    if (!environment.isDespia) {
      console.debug('Despia call skipped - not in Despia environment:', endpoint);
      return null;
    }
    
    try {
      if (returnKeys && returnKeys.length > 0) {
        return await despia(endpoint, returnKeys);
      }
      return despia(endpoint);
    } catch (error) {
      console.debug('Despia call failed:', endpoint, error);
      return null;
    }
  }, []);

  // Haptic helpers with web fallbacks
  const lightHaptic = useCallback(() => {
    if (environment.isDespia) {
      despia('lighthaptic://');
    } else {
      webVibrate(20);
    }
  }, [webVibrate]);

  const heavyHaptic = useCallback(() => {
    if (environment.isDespia) {
      despia('heavyhaptic://');
    } else {
      webVibrate(60);
    }
  }, [webVibrate]);

  const successHaptic = useCallback(() => {
    if (environment.isDespia) {
      despia('successhaptic://');
    } else {
      webVibrate([30, 80, 30]);
    }
  }, [webVibrate]);

  const warningHaptic = useCallback(() => {
    if (environment.isDespia) {
      despia('warninghaptic://');
    } else {
      webVibrate([20, 60, 20, 60, 20]);
    }
  }, [webVibrate]);

  const errorHaptic = useCallback(() => {
    if (environment.isDespia) {
      despia('errorhaptic://');
    } else {
      webVibrate([50, 100, 50]);
    }
  }, [webVibrate]);

  return useMemo(() => ({
    // Environment detection
    ...environment,
    
    // Haptic feedback
    lightHaptic,
    heavyHaptic,
    successHaptic,
    warningHaptic,
    errorHaptic,
    
    // Utility methods
    call,
    webVibrate
  }), [lightHaptic, heavyHaptic, successHaptic, warningHaptic, errorHaptic, call, webVibrate]);
};

// Export static environment for non-hook usage
export const getDespiaEnvironment = (): DespiaEnvironment => environment;
