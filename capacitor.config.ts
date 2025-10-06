import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.timeinbeta',
  appName: 'Time In',
  webDir: 'dist',
  // For production builds, comment out the server config below
  // For development with hot-reload, uncomment it
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