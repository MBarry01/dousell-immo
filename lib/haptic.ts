/**
 * Haptic feedback utilities for mobile interactions
 */

export const hapticFeedback = {
  /**
   * Light haptic feedback (for taps, clicks)
   */
  light: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium haptic feedback (for important actions)
   */
  medium: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy haptic feedback (for critical actions)
   */
  heavy: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Success pattern (for successful actions)
   */
  success: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 50, 10, 50, 10]);
    }
  },

  /**
   * Error pattern (for errors)
   */
  error: () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([20, 50, 20, 50, 20]);
    }
  },
};

