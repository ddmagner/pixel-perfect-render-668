import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useDespia } from './useDespia';

export const useHaptics = () => {
  const { isDespia, isNative, webVibrate, lightHaptic, heavyHaptic, successHaptic, warningHaptic, errorHaptic } = useDespia();

  const lightImpact = async () => {
    try {
      if (isDespia) {
        lightHaptic();
      } else if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        webVibrate(20);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate(20);
    }
  };

  const mediumImpact = async () => {
    try {
      if (isDespia) {
        lightHaptic();
      } else if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        webVibrate(40);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate(40);
    }
  };

  const heavyImpact = async () => {
    try {
      if (isDespia) {
        heavyHaptic();
      } else if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        webVibrate(60);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate(60);
    }
  };

  const selectionStart = async () => {
    try {
      if (isDespia) {
        lightHaptic();
      } else if (isNative) {
        await Haptics.selectionStart();
      } else {
        webVibrate(15);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate(15);
    }
  };

  const selectionChanged = async () => {
    try {
      if (isDespia) {
        lightHaptic();
      } else if (isNative) {
        await Haptics.selectionChanged();
      } else {
        webVibrate(10);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate(10);
    }
  };

  const selectionEnd = async () => {
    try {
      if (isDespia) {
        lightHaptic();
      } else if (isNative) {
        await Haptics.selectionEnd();
      } else {
        webVibrate([15, 50, 15]);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate([15, 50, 15]);
    }
  };

  // Notification-specific haptic patterns
  const successNotification = async () => {
    try {
      if (isDespia) {
        successHaptic();
      } else if (isNative) {
        await Haptics.notification({ type: NotificationType.Success });
      } else {
        webVibrate([30, 80, 30]);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate([30, 80, 30]);
    }
  };

  const warningNotification = async () => {
    try {
      if (isDespia) {
        warningHaptic();
      } else if (isNative) {
        await Haptics.notification({ type: NotificationType.Warning });
      } else {
        webVibrate([20, 60, 20, 60, 20]);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate([20, 60, 20, 60, 20]);
    }
  };

  const errorNotification = async () => {
    try {
      if (isDespia) {
        errorHaptic();
      } else if (isNative) {
        await Haptics.notification({ type: NotificationType.Error });
      } else {
        webVibrate([50, 100, 50]);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate([50, 100, 50]);
    }
  };

  // Custom patterns for specific app actions
  const timerStart = async () => {
    try {
      if (isDespia) {
        successHaptic();
      } else if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Medium });
        await new Promise(r => setTimeout(r, 100));
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        webVibrate([25, 50, 40]);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate([25, 50, 40]);
    }
  };

  const timerStop = async () => {
    try {
      if (isDespia) {
        lightHaptic();
      } else if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Light });
        await new Promise(r => setTimeout(r, 100));
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        webVibrate([40, 50, 25]);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate([40, 50, 25]);
    }
  };

  const reminder = async () => {
    try {
      if (isDespia) {
        warningHaptic();
      } else if (isNative) {
        await Haptics.notification({ type: NotificationType.Warning });
        await new Promise(r => setTimeout(r, 200));
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        webVibrate([15, 100, 15, 100, 30]);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate([15, 100, 15, 100, 30]);
    }
  };

  const celebration = async () => {
    try {
      if (isDespia) {
        successHaptic();
        await new Promise(r => setTimeout(r, 150));
        lightHaptic();
      } else if (isNative) {
        await Haptics.notification({ type: NotificationType.Success });
        await new Promise(r => setTimeout(r, 150));
        await Haptics.impact({ style: ImpactStyle.Light });
        await new Promise(r => setTimeout(r, 100));
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        webVibrate([30, 60, 20, 60, 20, 60, 40]);
      }
    } catch (error) {
      console.debug('Haptics not available:', error);
      webVibrate([30, 60, 20, 60, 20, 60, 40]);
    }
  };

  return {
    // Basic impacts
    lightImpact,
    mediumImpact,
    heavyImpact,
    // Selection feedback
    selectionStart,
    selectionChanged,
    selectionEnd,
    // Notification types
    successNotification,
    warningNotification,
    errorNotification,
    // Custom app patterns
    timerStart,
    timerStop,
    reminder,
    celebration
  };
};
