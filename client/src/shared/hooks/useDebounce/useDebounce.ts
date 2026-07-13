import { useEffect, useState } from 'react';

export const useDebounce = <TValue>(value: TValue, delayMs: number): TValue => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return (): void => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
};
