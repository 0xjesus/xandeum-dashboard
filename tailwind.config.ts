import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Xandeum brand colors (official)
        xandeum: {
          // Primary: Dark Blue #1C3850
          blue: {
            DEFAULT: '#1C3850',
            50: '#E8EEF3',
            100: '#C5D4E0',
            200: '#9FB7CA',
            300: '#7999B3',
            400: '#5C81A1',
            500: '#1C3850',
            600: '#182F44',
            700: '#142637',
            800: '#101D2B',
            900: '#0A1220',
          },
          // Primary: Orange #F3771F
          orange: {
            DEFAULT: '#F3771F',
            50: '#FEF3E9',
            100: '#FDE0C8',
            200: '#FBCBA3',
            300: '#F9B67E',
            400: '#F69649',
            500: '#F3771F',
            600: '#D4641A',
            700: '#B55215',
            800: '#964010',
            900: '#6B2E0B',
          },
          // Primary: Purple #5D2554
          purple: {
            DEFAULT: '#5D2554',
            50: '#F5EBF4',
            100: '#E8D1E5',
            200: '#D4AED0',
            300: '#BF8BBB',
            400: '#A868A6',
            500: '#5D2554',
            600: '#4E1F47',
            700: '#3F1939',
            800: '#30132C',
            900: '#210D1E',
          },
          // Background: Very Dark Blue #0A1039
          dark: {
            DEFAULT: '#0A1039',
            50: '#E6E8F0',
            100: '#C0C5DB',
            200: '#959FC4',
            300: '#6A79AD',
            400: '#475D9A',
            500: '#0A1039',
            600: '#080D2E',
            700: '#060A24',
            800: '#040719',
            900: '#02040F',
          },
        },
        // Custom dark theme
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(34, 197, 94, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
        shimmer: 'shimmer 2s infinite linear',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
