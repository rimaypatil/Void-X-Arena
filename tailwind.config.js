/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: {
          999: '#050509', // Darkest void
          950: '#08080D', // Primary background
          900: '#08080D', // Primary dark background
          850: '#100D18', // Secondary background
          800: '#171124', // Card / Surface
          750: '#1D142E',
          700: '#211735', // Elevated surface
          600: '#2A2140', // Borders
          500: '#453866', // Highlight border
          400: '#6D5A91', // Muted purple
          300: '#A8A1B8', // Secondary text
          200: '#DDD6FE', // Soft purple
          100: '#F8F7FF', // Primary text
        },
        purple: {
          brand: '#8B5CF6',    // Primary purple
          bright: '#A855F7',   // Bright accent
          hover: '#7C3AED',    // Hover / Active
          highlight: '#C4B5FD',// Highlight
          deep: '#5B21B6',     // Deep violet
          muted: '#6D5A91',    // Muted purple
          soft: '#DDD6FE',     // Soft purple
          blue: '#6366F1',     // Blue-violet support
        },
        status: {
          success: '#22C55E',  // Success
          warning: '#F59E0B',  // Warning
          danger: '#EF4444',   // Danger / Eliminated
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-outfit)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.14) 0%, rgba(8, 8, 13, 0) 70%)',
        'subtle-grid': 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        'hero-gradient': 'linear-gradient(180deg, rgba(8, 8, 13, 0.4) 0%, rgba(8, 8, 13, 0.9) 70%, #08080D 100%)',
      },
      boxShadow: {
        'purple-sm': '0 0 15px rgba(139, 92, 246, 0.18)',
        'purple-md': '0 0 25px rgba(139, 92, 246, 0.28)',
        'purple-lg': '0 0 45px rgba(139, 92, 246, 0.35)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-reverse': 'float-reverse 7s ease-in-out infinite',
        'radar': 'radar 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(10px)' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
