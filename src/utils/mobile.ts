/**
 * Mobile utility functions
 * 
 * This file contains helper functions for mobile UI improvements.
 */

/**
 * Detects if the current device is a mobile device
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detects if the current device is iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * Setup viewport height fix for mobile
 * This fixes the 100vh issue on mobile browsers
 */
export const setupViewportHeightFix = (): void => {
  if (typeof window === 'undefined') return;
  
  // Function to update CSS variable for viewport height
  const updateVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Set on load
  updateVH();

  // Update on resize and orientation change
  window.addEventListener('resize', updateVH);
  window.addEventListener('orientationchange', updateVH);
};

/**
 * Apply mobile touch improvements
 * Makes taps more responsive on mobile
 */
export const applyMobileTouchImprovements = (): void => {
  if (typeof window === 'undefined') return;
  
  // Make taps more responsive (no 300ms delay)
  document.documentElement.style.setProperty('touch-action', 'manipulation');
  
  // Prevent iOS bounce effect if needed
  if (isIOS()) {
    document.body.style.overscrollBehavior = 'none';
  }
};

/**
 * Initializes all mobile improvements
 * Call this function once at app startup
 */
export const initMobileImprovements = (): void => {
  setupViewportHeightFix();
  applyMobileTouchImprovements();
}; 