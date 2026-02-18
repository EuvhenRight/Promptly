'use client';

import { useState, useEffect, useRef } from 'react';

export function useScrollDirection() {
  const [scrollDir, setScrollDir] = useState('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      // Add a threshold to prevent sensitivity to small scrolls
      if (Math.abs(scrollY - lastScrollY.current) < 10) {
        return;
      }
      const direction = scrollY > lastScrollY.current ? 'down' : 'up';
      if (direction !== scrollDir) {
        setScrollDir(direction);
      }
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
    };

    // Use requestAnimationFrame for performance
    const onScroll = () => window.requestAnimationFrame(updateScrollDirection);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollDir]);

  return scrollDir;
}
