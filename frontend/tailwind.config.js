import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'], // customize or use any font
      },
      colors: {
        primary: '#2563eb', // Tailwind blue-600
        secondary: '#4f46e5', // Tailwind indigo-600
        accent: '#22c55e', // Tailwind green-500
      },
      animation: {
        pulseSlow: 'pulse 3s infinite',
        fadeIn: 'fadeIn 0.8s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    },
    screens: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
  plugins: [],
};

export default config;
