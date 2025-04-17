import { useEffect } from 'react';

/**
 * Custom hook for fixing touch interactions on mobile devices
 */
export function useMobileTouchFix() {
  // Fix for mobile touch issue
  useEffect(() => {
    // Fix for touch action on mobile
    const addTouchActionNone = () => {
      const buttons = document.querySelectorAll('.fixed button');
      buttons.forEach(button => {
        (button as HTMLElement).style.touchAction = 'manipulation';
      });
    };
    
    // Run on mount and when editing status changes
    addTouchActionNone();
    
    // Observer to catch dynamically added buttons
    const observer = new MutationObserver(addTouchActionNone);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);
} 