/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          900: '#0b0b12',
          800: '#12121d',
          700: '#1a1a28',
          600: '#23233a',
          500: '#2e2e4a',
        },
        accent: {
          DEFAULT: '#7c5cff',
          soft: '#9d86ff',
        },
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(124, 92, 255, 0.5)',
      },
      keyframes: {
        'mesh-move': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(8%, -6%) scale(1.1)' },
          '66%': { transform: 'translate(-6%, 8%) scale(0.95)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'mesh-move': 'mesh-move 18s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
