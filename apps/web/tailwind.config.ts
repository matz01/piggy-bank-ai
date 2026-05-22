import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pbai: {
          bg: '#fdf8f2',
          text: '#2c2218',
          muted: '#9d8a7a',
          dim: '#c9b8a8',
          border: '#e8d8c4',
          track: '#ede3d6',
          surface: '#fdf8f2',
          accent: '#b07d48',
          expense: '#c0392b',
          income: '#27ae60',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        ui: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'red-breathe': {
          '0%,100%': { boxShadow: '0 0 12px rgba(192,57,43,.8), 0 0 28px rgba(192,57,43,.3)' },
          '50%': { boxShadow: '0 0 24px rgba(220,70,50,1), 0 0 52px rgba(220,70,50,.5)' },
        },
        'arc-spin': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 350ms ease-out',
        'red-breathe': 'red-breathe 1.8s ease-in-out infinite',
        'arc-spin': 'arc-spin 1s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
