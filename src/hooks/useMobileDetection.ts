import { useState, useEffect } from 'react';

interface UseMobileDetectionReturn {
  isMobile: boolean;
  windowWidth: number;
  windowHeight: number;
}

export const useMobileDetection = (): UseMobileDetectionReturn => {
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    isMobile,
    windowWidth,
    windowHeight
  };
}; 