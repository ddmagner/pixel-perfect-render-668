import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import despia from 'despia-native';
import { WEB_BUILD, WEB_SEMVER } from '@/version';

interface AppVersionInfo {
  webVersion: string;
  webBuild: string;
  nativeVersion: string | null;
  nativeBuild: string | null;
  bundleId: string | null;
  platform: 'web' | 'ios' | 'android' | 'despia';
}

export const useAppVersion = () => {
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo>({
    webVersion: WEB_SEMVER,
    webBuild: WEB_BUILD,
    nativeVersion: null,
    nativeBuild: null,
    bundleId: null,
    platform: 'web'
  });

  const isDespia = typeof navigator !== 'undefined' && navigator.userAgent.includes('despia');
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const getAppInfo = async () => {
      try {
        if (isDespia) {
          // Use Despia's getappversion endpoint
          const info = await despia('getappversion://', ['versionNumber', 'bundleNumber']);
          setVersionInfo(prev => ({
            ...prev,
            nativeVersion: info?.versionNumber ?? null,
            nativeBuild: info?.bundleNumber ?? null,
            platform: 'despia'
          }));
        } else if (isNative) {
          // Use Capacitor's App plugin
          const info = await CapApp.getInfo();
          setVersionInfo(prev => ({
            ...prev,
            nativeVersion: info.version ?? null,
            nativeBuild: (info as any).build ?? null,
            bundleId: (info as any).id ?? null,
            platform: Capacitor.getPlatform() as 'ios' | 'android'
          }));
        }
      } catch (error) {
        console.debug('Failed to get app version info:', error);
      }
    };

    getAppInfo();
  }, [isDespia, isNative]);

  return versionInfo;
};
