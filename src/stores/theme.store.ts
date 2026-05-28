import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  init: () => void;
}

const STORAGE_KEY = 'app-theme-preference';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',

  setTheme: (theme) => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    localStorage.setItem(STORAGE_KEY, theme);
    applyThemeClass(resolved);
    set({ theme, resolvedTheme: resolved });
  },

  toggle: () => {
    const { resolvedTheme } = get();
    const next = resolvedTheme === 'light' ? 'dark' : 'light';
    get().setTheme(next);
  },

  init: () => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
    const resolved = saved === 'system' ? getSystemTheme() : saved;
    applyThemeClass(resolved);
    set({ theme: saved, resolvedTheme: resolved });

    // Escuchar cambios del sistema cuando theme es 'system'
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', (e) => {
      if (get().theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        applyThemeClass(newResolved);
        set({ resolvedTheme: newResolved });
      }
    });
  },
}));
