import { useState, useEffect } from 'react';
import { ScreenMode } from '../types';

export const useScreenMode = (): ScreenMode => {
  const [screenMode, setScreenMode] = useState<ScreenMode>('desktop');

  useEffect(() => {
    const checkScreenMode = () => {
      const width = window.innerWidth;
      
      if (width <= 768) {
        setScreenMode('mobile');
      } else if (width <= 1024) {
        setScreenMode('tablet');
      } else {
        setScreenMode('desktop');
      }
    };

    // Check on mount
    checkScreenMode();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenMode);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenMode);
    };
  }, []);

  return screenMode;
};
