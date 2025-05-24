/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
      },
      fontFamily: {
        sans: ['var(--font-noto)'],
        signika: ['var(--font-signika)'],
        'dm-sans': ['var(--font-dm-sans)'],
      },
      animation: {
        'fade-in': 'simpleFadeIn 0.3s ease-out forwards',
        'pulse-bar': 'pulseBar 1.5s ease-in-out infinite',
        'pulse-bar-delay': 'pulseBarShort 1.5s ease-in-out 0.2s infinite',
        'pulse-bar-delay2': 'pulseBar 1.5s ease-in-out 0.4s infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        simpleFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseBar: {
          '0%, 100%': { 
            height: '24px',
            opacity: '0.6'
          },
          '50%': { 
            height: '12px',
            opacity: '0.2'
          }
        },
        pulseBarShort: {
          '0%, 100%': { 
            height: '16px',
            opacity: '0.6'
          },
          '50%': { 
            height: '8px',
            opacity: '0.2'
          }
        },
        glow: {
          '0%, 100%': { 
            opacity: '0.5',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '0.8',
            transform: 'scale(1.1)'
          }
        }
      }
    },
  },
  plugins: [],
}