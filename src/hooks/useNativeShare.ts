import { useCallback } from 'react';
import { Share } from '@capacitor/share';
import despia from 'despia-native';
import { useDespia } from './useDespia';
import { useHaptics } from './useHaptics';

interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  message?: string;
}

export const useNativeShare = () => {
  const { isDespia, isNative } = useDespia();
  const { successNotification } = useHaptics();

  const canShare = useCallback(async (): Promise<boolean> => {
    if (isDespia) {
      return true;
    }
    
    if (isNative) {
      try {
        const result = await Share.canShare();
        return result.value;
      } catch {
        return false;
      }
    }
    
    // Web share API
    return 'share' in navigator;
  }, [isDespia, isNative]);

  const share = useCallback(async (options: ShareOptions): Promise<boolean> => {
    try {
      if (isDespia) {
        // Use Despia native share
        const message = options.text || options.message || '';
        const url = options.url || '';
        despia(`shareapp://message?=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`);
        successNotification();
        return true;
      }

      if (isNative) {
        // Use Capacitor Share
        await Share.share({
          title: options.title,
          text: options.text || options.message,
          url: options.url,
          dialogTitle: options.title || 'Share'
        });
        successNotification();
        return true;
      }

      // Web Share API fallback
      if ('share' in navigator) {
        await navigator.share({
          title: options.title,
          text: options.text || options.message,
          url: options.url
        });
        successNotification();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }, [isDespia, isNative, successNotification]);

  const shareTimeEntry = useCallback(async (entry: {
    duration: number;
    task: string;
    project: string;
    client: string;
    date: string;
  }): Promise<boolean> => {
    const message = `Time Entry: ${entry.duration}h of ${entry.task} on ${entry.project} for ${entry.client} (${entry.date})`;
    return share({
      title: 'Time Entry',
      text: message
    });
  }, [share]);

  const shareInvoice = useCallback(async (options: {
    invoiceNumber: string;
    clientName: string;
    totalHours: number;
    totalAmount?: number;
    url?: string;
  }): Promise<boolean> => {
    const amountText = options.totalAmount ? ` - $${options.totalAmount.toFixed(2)}` : '';
    const message = `Invoice #${options.invoiceNumber} for ${options.clientName}: ${options.totalHours}h${amountText}`;
    return share({
      title: `Invoice #${options.invoiceNumber}`,
      text: message,
      url: options.url
    });
  }, [share]);

  const shareReport = useCallback(async (options: {
    reportType: 'timecard' | 'invoice';
    period?: string;
    totalHours: number;
    url?: string;
  }): Promise<boolean> => {
    const type = options.reportType === 'invoice' ? 'Invoice' : 'Time Card';
    const periodText = options.period ? ` (${options.period})` : '';
    const message = `${type} Report${periodText}: ${options.totalHours} hours logged`;
    return share({
      title: `${type} Report`,
      text: message,
      url: options.url
    });
  }, [share]);

  return {
    canShare,
    share,
    shareTimeEntry,
    shareInvoice,
    shareReport,
    isDespia,
    isNative
  };
};
