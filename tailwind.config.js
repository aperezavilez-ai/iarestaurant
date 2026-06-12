/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        command: {
          bg: '#FFF8F0',
          surface: '#FFFFFF',
          elevated: '#F0F1F3',
          card: '#E8EAED',
          border: '#E5E7EB',
        },
        brand: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        orange: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        ai: {
          400: '#0EA5E9',
          500: '#0284C7',
          600: '#0369A1',
        },
        ops: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#2563EB',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(245, 158, 11, 0.2)',
        'glow-orange': '0 0 16px rgba(249, 115, 22, 0.15)',
        panel: '0 2px 12px rgba(120, 53, 15, 0.08)',
        card: '0 1px 4px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'pulse-live': 'pulse-live 2s ease-in-out infinite',
        fadeUp: 'fadeUp 0.4s ease-out',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.15)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
