import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

export function useStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    const loadValue = async () => {
      try {
        const { value } = await Preferences.get({ key });
        if (value !== null) {
          setStoredValue(JSON.parse(value));
        }
      } catch (error) {
        console.error('Error loading from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key]);

  // Save to storage
  const setValue = async (value: T) => {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(value),
      });
      setStoredValue(value);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  };

  return [storedValue, setValue, isLoading] as const;
}