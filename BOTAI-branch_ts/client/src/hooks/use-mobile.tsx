import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the viewport is mobile (less than 640px)
 * @returns boolean indicating if the current viewport is considered mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkIfMobile() {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
    }

    // Check initially
    checkIfMobile();

    // Set up listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile;
}