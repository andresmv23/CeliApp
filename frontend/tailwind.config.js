/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Verde bosque suave — más profundo, menos "Bootstrap"
        brand: {
          50:  '#edf7f2',
          100: '#c8eadb',
          200: '#93d4b8',
          300: '#5ab896',
          400: '#2d9c77',
          500: '#1a7f5e',   // primario — verde bosque
          600: '#156649',
          700: '#0f4d37',
          800: '#093325',
          900: '#041a13',
        },
        // Cremas más ricas y cálidas
        cream: {
          50:  '#fdfcf8',
          100: '#f9f7f0',
          200: '#f2ede3',
          300: '#e6ded0',
          400: '#d4cab8',
        },
        // Colores de estado sin cambios (los usa la lógica)
        apto:   '#1a7f5e',
        noapto: '#dc2626',
        dudoso: '#b45309',
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.07)',
        'glow-brand': '0 0 0 3px rgba(26,127,94,0.18)',
        'input-focus':'0 0 0 4px rgba(26,127,94,0.14)',
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.85)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fade-in 0.3s ease both',
        shimmer:      'shimmer 1.5s ease-in-out infinite',
        'count-up':   'count-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-dot':  'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
