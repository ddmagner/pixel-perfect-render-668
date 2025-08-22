import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useHaptics = () => {
  const lightImpact = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available on web or error occurred
      console.debug('Haptics not available:', error);
    }
  };

  const mediumImpact = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  };

  const heavyImpact = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  };

  const selectionStart = async () => {
    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  };

  const selectionChanged = async () => {
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  };

  const selectionEnd = async () => {
    try {
      await Haptics.selectionEnd();
    } catch (error) {
      console.debug('Haptics not available:', error);
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