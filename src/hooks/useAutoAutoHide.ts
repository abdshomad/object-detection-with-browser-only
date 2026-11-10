import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage auto-hiding UI elements after a period of user inactivity.
 * Resets the inactivity timer on mouse move, touch, click, or key press.
 */
export function useAutoAutoHide(delayMs: number = 3000, isPaused: boolean = false) {
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    setIsVisible(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    if (!isPaused) {
      timerRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, delayMs);
    }
  }, [delayMs, isPaused]);

  useEffect(() => {
    resetTimer();

    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('mousedown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('touchmove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('touchmove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [resetTimer]);

  const showControls = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return { isVisible, showControls };
}
