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
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
