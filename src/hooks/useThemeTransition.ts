import { useCallback, useRef } from 'react';
import { useThemeStore } from '../stores/theme.store';

/**
 * Hook que envuelve el cambio de tema con la View Transitions API.
 * Genera una animación circular que se expande desde el punto de clic
 * (o desde el centro de la pantalla si no hay evento).
 *
 * Fallback: si el navegador no soporta startViewTransition,
 * realiza el cambio de tema de forma instantánea.
 */
export function useThemeTransition() {
  const { resolvedTheme, toggle } = useThemeStore();
  const isTransitioningRef = useRef(false);

  const toggleTheme = useCallback(
    (event?: React.MouseEvent<HTMLElement>) => {
      if (isTransitioningRef.current) return;

      const doc = document as Document & {
        startViewTransition?: (callback: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      };

      if (!doc.startViewTransition) {
        toggle();
        return;
      }

      isTransitioningRef.current = true;

      // Coordenadas del origen de la animación
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? window.innerHeight / 2;

      // Radio necesario para cubrir toda la pantalla desde el punto de origen
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = doc.startViewTransition(() => {
        toggle();
      });

      transition.ready
        .then(() => {
          const maskSizeEnd = endRadius * 3;

          document.documentElement.animate(
            {
              maskImage: [
                'radial-gradient(circle closest-side, black 70%, transparent 100%)',
                'radial-gradient(circle closest-side, black 70%, transparent 100%)'
              ],
              WebkitMaskImage: [
                'radial-gradient(circle closest-side, black 70%, transparent 100%)',
                'radial-gradient(circle closest-side, black 70%, transparent 100%)'
              ],
              maskRepeat: ['no-repeat', 'no-repeat'],
              WebkitMaskRepeat: ['no-repeat', 'no-repeat'],
              maskSize: [
                '0px 0px',
                `${maskSizeEnd}px ${maskSizeEnd}px`
              ],
              WebkitMaskSize: [
                '0px 0px',
                `${maskSizeEnd}px ${maskSizeEnd}px`
              ],
              maskPosition: [
                `${x}px ${y}px`,
                `${x - maskSizeEnd / 2}px ${y - maskSizeEnd / 2}px`
              ],
              WebkitMaskPosition: [
                `${x}px ${y}px`,
                `${x - maskSizeEnd / 2}px ${y - maskSizeEnd / 2}px`
              ]
            },
            {
              duration: 800,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {
          // Si la transición falla, el tema ya fue aplicado en el callback
        })
        .finally(() => {
          transition.finished
            .then(() => {
              isTransitioningRef.current = false;
            })
            .catch(() => {
              isTransitioningRef.current = false;
            });
        });
    },
    [toggle]
  );

  return { toggleTheme, resolvedTheme };
}
