import { useEffect, useState, useRef } from 'react';

/**
 * Hook that debounces a value with support for immediate flush on specific transitions
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // For empty strings (clearing search), apply immediately
    if (typeof value === 'string' && value === '') {
      setDebouncedValue(value);
      return;
    }

    // Otherwise, debounce the update
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
