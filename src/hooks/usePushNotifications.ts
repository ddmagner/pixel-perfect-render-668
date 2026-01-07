import { useEffect, useCallback } from 'react';
import despia from 'despia-native';
import { useAuth } from '@/hooks/useAuth';

export function usePushNotifications() {
  const { user } = useAuth();
  const isDespiaNative = typeof navigator !== 'undefined' && navigator.userAgent.includes('despia');

  // Register user's external ID with OneSignal on app load
  useEffect(() => {
    if (!isDespiaNative || !user?.id) {
      return;
    }

    // Set the OneSignal external user ID to link this device with the user
    console.log('Registering OneSignal external ID for user:', user.id);
    despia(`setonesignalplayerid://?user_id=${user.id}`);
  }, [isDespiaNative, user?.id]);

  // Request notification permission (handled natively by OneSignal/Despia)
  const requestPermission = useCallback(() => {
    if (!isDespiaNative) {
      console.log('Push notifications are only available in the native app');
      return;
    }
    
    // OneSignal handles permission requests automatically in the native app
    console.log('Push notification permission is handled by OneSignal natively');
  }, [isDespiaNative]);

  return {
    isDespiaNative,
    requestPermission,
  };
}
