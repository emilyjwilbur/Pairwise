import { useCallback, useEffect, useRef, useState } from 'react';

/** Copy text to the clipboard and expose a short-lived "copied" flag for button labels. */
export function useCopy(resetMs = 1600) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string, key = 'default') => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(null), resetMs);
      } catch {
        setCopied(null);
      }
    },
    [resetMs],
  );

  return { copied, copy };
}
