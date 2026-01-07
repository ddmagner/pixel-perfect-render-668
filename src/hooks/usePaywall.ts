import { useState, useCallback } from 'react';

export function usePaywall() {
  const [isOpen, setIsOpen] = useState(false);

  const openPaywall = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openPaywall,
    closePaywall,
  };
}
