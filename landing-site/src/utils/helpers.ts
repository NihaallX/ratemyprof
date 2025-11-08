// Analytics utility for tracking user interactions
export const trackEvent = (eventType: string, data?: Record<string, any>) => {
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      data: data || {},
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {
    // Silently fail - analytics shouldn't break user experience
  });
};

// Check for reduced motion preference
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check for low power mode (approximate)
export const isLowPowerMode = (): boolean => {
  // @ts-ignore - navigator.deviceMemory is not in all TypeScript defs
  const memory = navigator.deviceMemory;
  // @ts-ignore - navigator.hardwareConcurrency
  const cores = navigator.hardwareConcurrency;
  
  // Heuristic: low memory or few cores suggests low-power device
  return (memory && memory < 4) || (cores && cores < 4);
};

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Linear interpolation
export const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

// Map value from one range to another
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
