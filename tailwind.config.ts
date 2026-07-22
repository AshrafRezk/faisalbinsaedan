import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        arabic: ['"PP Neue Montreal Arabic"', 'system-ui', 'sans-serif'],
        english: ['"PP Telegraf"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        secondary: 'hsl(var(--secondary))',
        card: 'hsl(var(--card))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        border: 'hsl(var(--border))',
        aurora: {
          1: 'hsl(var(--aurora-1))',
          2: 'hsl(var(--aurora-2))',
          3: 'hsl(var(--aurora-3))',
          4: 'hsl(var(--aurora-4))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-navy': 'var(--gradient-navy)',
        'gradient-gold': 'var(--gradient-gold)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        elegant: 'var(--shadow-elegant)',
        gold: 'var(--shadow-gold)',
      },
    },
  },
  plugins: [],
} satisfies Config

