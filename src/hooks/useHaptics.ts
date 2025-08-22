import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const useHaptics = () => {
  const isNative = Capacitor.isNativePlatform();

  // Web vibration fallback function
  const webVibrate = (pattern: number | number[]) => {
    console.log('Attempting web vibration, isNative:', isNative);
    console.log('Navigator vibrate available:', 'vibrate' in navigator);
    console.log('User agent:', navigator.userAgent);
    
    if ('vibrate' in navigator) {
      try {
        const result = navigator.vibrate(pattern);
        console.log('Vibration result:', result);
        return result;
      } catch (error) {
        console.debug('Web vibration failed:', error);
        return false;
      }
    }
    console.log('Vibration API not available');
    return false;
  };

  const lightImpact = async () => {
    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        // Light vibration: short pulse
        webVibrate(20);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      // Fallback to web vibration if Capacitor fails
      webVibrate(20);
    }
  };

  const mediumImpact = async () => {
    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        // Medium vibration: medium pulse
        webVibrate(40);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate(40);
    }
  };

  const heavyImpact = async () => {
    try {
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        // Heavy vibration: strong pulse
        webVibrate(60);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate(60);
    }
  };

  const selectionStart = async () => {
    try {
      if (isNative) {
        await Haptics.selectionStart();
      } else {
        // Selection start: subtle pulse
        webVibrate(15);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate(15);
    }
  };

  const selectionChanged = async () => {
    try {
      if (isNative) {
        await Haptics.selectionChanged();
      } else {
        // Selection changed: very light pulse
        webVibrate(10);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate(10);
    }
  };

  const selectionEnd = async () => {
    try {
      if (isNative) {
        await Haptics.selectionEnd();
      } else {
        // Selection end: double light pulse
        webVibrate([15, 50, 15]);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate([15, 50, 15]);
    }
  };

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    selectionStart,
    selectionChanged,
    selectionEnd
  };
};