import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.90417b0646904e77b9f5e0a1c7808d94',
  appName: 'Time In',
  webDir: 'dist',
  server: {
    url: 'https://90417b06-4690-4e77-b9f5-e0a1c7808d94.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
    },
    Haptics: {
      // Enable native haptic feedback
    },
  },
};

export default config;