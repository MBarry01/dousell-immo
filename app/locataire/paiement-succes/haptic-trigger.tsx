'use client';

import { useEffect } from 'react';

/**
 * Triggers haptic feedback (vibration) on mount for payment success.
 * Only works on devices that support the Vibration API (mostly mobile).
 */
export function HapticTrigger() {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }, []);

  return null;
}
