import { useThemeStore } from '@/stores/theme.store';

export interface ChartTheme {
  /** CartesianGrid stroke color */
  grid: string;
  /** XAxis / YAxis tick fill color */
  axis: string;
  /** Tooltip cursor fill (BarChart) */
  cursor: string;
  /** Tooltip cursor stroke (AreaChart) */
  cursorStroke: string;
  /** White ring around dots → becomes dark in dark mode */
  dotStroke: string;
  /** Subtle bar hover overlay */
  barHover: string;
}

/**
 * Returns Recharts-compatible color values that adapt to the current
 * light / dark theme.  Use these for SVG attributes (stroke, fill, etc.).
 */
export function useChartTheme(): ChartTheme {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  return {
    grid: isDark ? '#374151' : '#e5e7eb',
    axis: isDark ? '#9ca3af' : '#6b7280',
    cursor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.06)',
    cursorStroke: isDark ? '#4f46e5' : '#c7d2fe',
    dotStroke: isDark ? '#1a1a1a' : '#ffffff',
    barHover: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
  };
}
