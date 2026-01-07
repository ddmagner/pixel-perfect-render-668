import { useState, useEffect, useCallback } from 'react';
import despia from 'despia-native';

interface PurchaseData {
  planID: string;
  transactionID: string;
  subreceipts?: string;
}

interface RevenueCatState {
  isPurchasing: boolean;
  purchaseSuccess: boolean;
  purchaseError: string | null;
  lastPurchase: PurchaseData | null;
}

declare global {
  interface Window {
    iapSuccess: (data: PurchaseData) => void;
  }
}

export function useRevenueCat() {
  const [state, setState] = useState<RevenueCatState>({
    isPurchasing: false,
    purchaseSuccess: false,
    purchaseError: null,
    lastPurchase: null,
  });

  const isDespiaNative = typeof navigator !== 'undefined' && navigator.userAgent.includes('despia');

  useEffect(() => {
    if (!isDespiaNative) {
      return;
    }

    // Set up global callback for successful purchases
    window.iapSuccess = (data: PurchaseData) => {
      console.log('RevenueCat purchase successful:', data);
      setState(prev => ({
        ...prev,
        isPurchasing: false,
        purchaseSuccess: true,
        purchaseError: null,
        lastPurchase: data,
      }));
    };

    return () => {
      delete window.iapSuccess;
    };
  }, [isDespiaNative]);

  const purchase = useCallback((userId: string, productId: string) => {
    if (!isDespiaNative) {
      setState(prev => ({
        ...prev,
        purchaseError: 'In-app purchases are only available in the native app',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isPurchasing: true,
      purchaseSuccess: false,
      purchaseError: null,
    }));

    // Trigger RevenueCat purchase
    despia(`revenuecat://purchase?external_id=${userId}&product=${productId}`);
  }, [isDespiaNative]);

  const reset = useCallback(() => {
    setState({
      isPurchasing: false,
      purchaseSuccess: false,
      purchaseError: null,
      lastPurchase: null,
    });
  }, []);

  return {
    ...state,
    purchase,
    reset,
    isDespiaNative,
  };
}
