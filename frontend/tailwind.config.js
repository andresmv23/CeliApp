/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0faf5',
          100: '#d6f2e4',
          200: '#aee4c9',
          300: '#76ceaa',
          400: '#3db386',
          500: '#01a269',
          600: '#008055',
          700: '#006644',
          800: '#004d33',
          900: '#003322',
        },
        cream: {
          50:  '#fdfcf9',
          100: '#faf8f3',
          200: '#f3efe6',
          300: '#e8e2d5',
        },
        apto:    '#01a269',
        noapto:  '#dc2626',
        dudoso:  '#d97706',
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
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.08)',
        'input-focus': '0 0 0 4px rgba(1,162,105,0.12)',
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
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
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fade-in 0.25s ease both',
        shimmer:      'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}