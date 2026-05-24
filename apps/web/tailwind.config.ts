import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pbai: {
          bg: '#f5f3f0',
          text: '#1c1a18',
          muted: '#7a746d',
          dim: '#b2aba3',
          border: '#d6d0c8',
          track: '#e5dfd8',
          surface: '#f5f3f0',
          accent: '#c9a84c',
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
