import { useEffect, useRef } from 'react';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const STORAGE_KEY = 'nobs_last_activity_time';

interface UseInactivityTimeoutOptions {
  timeoutMs?: number;
  enabled: boolean;
  onTimeout: () => void;
}

export function useInactivityTimeout({
  timeoutMs = THREE_HOURS_MS,
  enabled,
  onTimeout,
}: UseInactivityTimeoutOptions) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return;

    // Record initial activity time
    const initialTime = Date.now();
    try {
      const savedTime = localStorage.getItem(STORAGE_KEY);
      if (savedTime) {
        const elapsed = initialTime - Number(savedTime);
        if (elapsed >= timeoutMs) {
          onTimeoutRef.current();
          return;
        }
      }
      localStorage.setItem(STORAGE_KEY, String(initialTime));
    } catch {
      // ignore localStorage errors
    }

    let lastRecordTime = Date.now();

    const recordActivity = () => {
      const now = Date.now();
      // Throttle recording to every 10 seconds to avoid excessive localStorage writes
      if (now - lastRecordTime > 10000) {
        lastRecordTime = now;
        try {
          localStorage.setItem(STORAGE_KEY, String(now));
        } catch {
          // ignore
        }
      }
    };

    const checkInactivity = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const last = stored ? Number(stored) : lastRecordTime;
        const elapsed = Date.now() - last;
        if (elapsed >= timeoutMs) {
          onTimeoutRef.current();
        }
      } catch {
        if (Date.now() - lastRecordTime >= timeoutMs) {
          onTimeoutRef.current();
        }
      }
    };

    // User activity listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });

    // Check periodically every 20 seconds
    const intervalId = setInterval(checkInactivity, 20000);

    // Also check immediately when tab regains focus or visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkInactivity);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkInactivity);
    };
  }, [enabled, timeoutMs]);
}
