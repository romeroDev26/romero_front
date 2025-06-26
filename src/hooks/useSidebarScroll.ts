// src/hooks/useSidebarScroll.ts
import { useRef, useLayoutEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'dashboard_sidebar_scroll';
let timeoutId: NodeJS.Timeout;

export const useSidebarScroll = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useLayoutEffect(() => {
    const savedScrollPosition = localStorage.getItem(STORAGE_KEY);
    if (savedScrollPosition && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(savedScrollPosition, 10);
    }
  }, [location.pathname]); 

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const currentScroll = scrollRef.current.scrollTop;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, currentScroll.toString());
      }, 150); // Un debounce de 150ms es suficiente
    }
  }, []);

  return { scrollRef, handleScroll };
};