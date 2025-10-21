'use client';

import { useEffect, useState } from 'react';

export default function useScreenSizeWatcher() {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Detect screen size
  useEffect(() => {
    const updateScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    updateScreen();
    window.addEventListener('resize', updateScreen);
    return () => window.removeEventListener('resize', updateScreen);
  }, []);

  return { isLargeScreen };
}
