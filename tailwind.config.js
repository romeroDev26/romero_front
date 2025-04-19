/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'primary': '#1F4690', // Puedes ajustar a los colores de Transportes Romero
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
    plugins: [],
  }