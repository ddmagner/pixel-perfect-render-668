import { useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { useDespia, type Platform } from './useDespia';
import { WEB_BUILD, WEB_SEMVER } from '@/version';

interface AppVersionInfo {
  webVersion: string;
  webBuild: string;
  nativeVersion: string | null;
  nativeBuild: string | null;
  bundleId: string | null;
  platform: Platform;
}

export const useAppVersion = () => {
  const { isDespia, isNative, platform, call } = useDespia();
  
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo>({
    webVersion: WEB_SEMVER,
    webBuild: WEB_BUILD,
    nativeVersion: null,
    nativeBuild: null,
    bundleId: null,
    platform
  });

  useEffect(() => {
    const getAppInfo = async () => {
      try {
        if (isDespia) {
          // Use Despia's getappversion endpoint
          const info = await call('getappversion://', ['versionNumber', 'bundleNumber']);
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
            platform
          }));
        }
      } catch (error) {
        console.debug('Failed to get app version info:', error);
      }
    };

    getAppInfo();
  }, [isDespia, isNative, platform, call]);

  return versionInfo;
};
