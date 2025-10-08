// src/hooks/useSidebarScroll.ts
import { useRef, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dashboard_sidebar_scroll';

export const useSidebarScroll = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const restoreTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Restaurar scroll observando cambios en el contenido
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const savedScrollPosition = localStorage.getItem(STORAGE_KEY);
    if (!savedScrollPosition) return;

    const targetScroll = parseInt(savedScrollPosition, 10);
    let hasRestored = false;

    // Función para restaurar el scroll
    const restoreScroll = () => {
      if (!container || hasRestored) return;
      
      // Verificar que el contenedor tenga suficiente altura
      if (container.scrollHeight > container.clientHeight) {
        container.scrollTop = targetScroll;
        hasRestored = true;
      }
    };

    // Observar cambios en el DOM (cuando se expanden/colapsan menús)
    const observer = new MutationObserver(() => {
      if (!hasRestored) {
        // Cancelar intento anterior
        if (restoreTimeoutRef.current) {
          clearTimeout(restoreTimeoutRef.current);
        }
        // Intentar restaurar después de que se estabilice el contenido
        restoreTimeoutRef.current = setTimeout(restoreScroll, 100);
      }
    });

    // Observar cambios en el contenido del sidebar
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    // Primer intento después de un delay inicial
    restoreTimeoutRef.current = setTimeout(restoreScroll, 250);

    // Cleanup
    return () => {
      observer.disconnect();
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const currentScroll = scrollRef.current.scrollTop;
    
    // Limpiar timeout anterior
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    
    // Guardar después de un debounce de 150ms
    timeoutIdRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, currentScroll.toString());
    }, 150);
  }, []);

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return { scrollRef, handleScroll };
};