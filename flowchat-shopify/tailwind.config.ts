import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  prefix: 'fc-',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--fc-border))',
        background: 'hsl(var(--fc-background))',
        foreground: 'hsl(var(--fc-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--fc-primary))',
          foreground: 'hsl(var(--fc-primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--fc-muted))',
          foreground: 'hsl(var(--fc-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--fc-accent))',
          foreground: 'hsl(var(--fc-accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--fc-destructive))',
          foreground: 'hsl(var(--fc-destructive-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--fc-radius)',
        md: 'calc(var(--fc-radius) - 2px)',
        sm: 'calc(var(--fc-radius) - 4px)',
      },
      keyframes: {
        'fc-slide-up': {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fc-slide-down': {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to: { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
        },
        'fc-pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.4' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'fc-typing-dot': {
          '0%, 60%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'fc-slide-up': 'fc-slide-up 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fc-slide-down': 'fc-slide-down 0.2s ease-in forwards',
        'fc-pulse-ring': 'fc-pulse-ring 2s ease-out infinite',
        'fc-typing-dot': 'fc-typing-dot 1.4s infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
