/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        saira: ['Saira', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        large: '24px',
        pill: '9999px',
        'auth-card': '10px',
        'auth-btn': '2px',
        'auth-input': '2px',
      },
      boxShadow: {
        subtle: 'rgba(0, 0, 0, 0.08) 0px 1px 1px 1px, rgba(0, 0, 0, 0.06) 0px 0px 0px 0.5px',
        'subtle-2': 'rgba(0, 0, 0, 0.08) 0px 1px 1px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px',
        'subtle-3': 'rgba(0, 0, 0, 0.06) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 8px 16px 0px, rgba(0, 0, 0, 0.02) 0px 0px 0px 1px',
        'auth-sm': 'rgba(186, 207, 247, 0.32) 0px 0px 6px 0px',
        'auth-md': 'rgba(238, 186, 247, 0.24) 0px 0px 12px 0px',
        'auth-subtle': 'rgba(186, 215, 247, 0.12) 0px 0px 0px 1px inset',
        'auth-subtle-2': 'rgba(199, 211, 234, 0.12) -0.5px 0.5px 1px 0px inset, rgba(186, 215, 247, 0.08) 0px 0px 96px 0px inset',
        'auth-subtle-3': 'rgba(186, 214, 247, 0.06) 0px 0px 0px 1px inset',
        'auth-subtle-4': 'rgba(199, 211, 234, 0.12) 0px 1px 1px 0px inset, rgba(199, 211, 234, 0.05) 0px 24px 48px 0px inset, rgba(6, 6, 14, 0.7) 0px 24px 32px 0px',
      },
      colors: {
        'primary': '#1F4690',
        'primary-dark': '#163672',
        'secondary': '#3A5BA0',
        'accent': '#FFA500',
        'neutral': '#F5F5F5',
        'base-100': '#FFFFFF',
        'info': '#3ABFF8',
        'success': '#36D399',
        'warning': '#FBBD23',
        'error': '#F87272',
        brand: {
          DEFAULT: '#918df6',
          light: '#dad9fc',
          deep: '#9580ff',
        },
        ink: '#181925',
        'medium-gray': '#666666',
        'muted-gray': '#999999',
        'light-gray': '#e8e8e8',
        'pale-mint': '#def6e4',
        'success-green': '#33c758',
        'warning-yellow': '#ffa600',
        'accent-pink': '#d6409f',
        surface: '#fafafa',
        canvas: '#ffffff',

        // ═══════════════════════════════════════════════════════════
        // TOKENS SEMÁNTICOS PARA DARK MODE
        // ═══════════════════════════════════════════════════════════
        'dm-bg': {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          accent: 'var(--bg-accent)',
          hover: 'var(--bg-hover)',
          badge: 'var(--bg-badge)',
        },
        'dm-text': {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
        },
        'dm-border': {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
        },

        // AuthKit Design Tokens
        'midnight-ink': 'var(--color-midnight-ink)',
        'graphite-plate': 'var(--color-graphite-plate)',
        'steel-border': 'var(--color-steel-border)',
        fog: 'var(--color-fog)',
        pebble: 'var(--color-pebble)',
        moonlight: 'var(--color-moonlight)',
        ice: 'var(--color-ice)',
        glacier: 'var(--color-glacier)',
        'frost-link': 'var(--color-frost-link)',
        'electric-iris': 'var(--color-electric-iris)',
        'blueprint-glow': 'var(--color-blueprint-glow)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
