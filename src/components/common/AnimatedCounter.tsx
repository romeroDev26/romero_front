import { useInView, useMotionValue, useSpring } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  durationMs?: number;
  locale?: string;
  prefix?: string;
  suffix?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  className?: string;
  startOnView?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  from = 0,
  direction = 'up',
  delay = 0,
  durationMs = 2000,
  locale = 'es-PE',
  prefix = '',
  suffix = '',
  minimumFractionDigits,
  maximumFractionDigits,
  className,
  startOnView = true,
  separator = '',
  onStart,
  onEnd,
}) => {
  const ref = useRef<HTMLSpanElement>(null);

  // Duración en segundos para los cálculos de spring
  const duration = durationMs / 1000;

  // motion value starts at the initial position
  const motionValue = useMotionValue(direction === 'down' ? value : from);

  // Spring physics — igual que ReactBits
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, { damping, stiffness });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  // Formatter con las opciones del proyecto (locale, separador de miles, decimales)
  const formatter = useMemo(() => {
    const opts: Intl.NumberFormatOptions = {
      useGrouping: !!separator,
      minimumFractionDigits,
      maximumFractionDigits,
    };
    return new Intl.NumberFormat(locale, opts);
  }, [locale, separator, minimumFractionDigits, maximumFractionDigits]);

  const formatValue = useCallback(
    (latest: number) => {
      let formatted = formatter.format(latest);
      // Si el usuario pasó un separator custom (ej. '.'), reemplazamos la coma de grouping
      if (separator && separator !== ',') {
        formatted = formatted.replace(/,/g, separator);
      }
      return `${prefix}${formatted}${suffix}`;
    },
    [formatter, prefix, suffix, separator]
  );

  // Inicializa el texto del span sin esperar al spring
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === 'down' ? value : from);
    }
  }, [from, value, direction, formatValue]);

  // Dispara la animación cuando entra en vista (o inmediatamente si startOnView=false)
  useEffect(() => {
    const shouldStart = startOnView ? isInView : true;
    if (!shouldStart) return;

    if (typeof onStart === 'function') onStart();

    const timeoutId = setTimeout(() => {
      motionValue.set(direction === 'down' ? from : value);
    }, delay * 1000);

    const endTimeoutId = setTimeout(() => {
      if (typeof onEnd === 'function') onEnd();
    }, delay * 1000 + durationMs);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(endTimeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, startOnView]);

  // Suscribe al spring para actualizar el DOM
  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span ref={ref} className={className} />;
};
