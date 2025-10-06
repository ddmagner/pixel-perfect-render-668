import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Configure status bar for native apps
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
