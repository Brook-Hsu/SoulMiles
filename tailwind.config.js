/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gothic-dark': '#0a0a1a',
        'gothic-purple': '#6b46c1',
        'soul-glow': '#a78bfa',
        'treasure-gold': '#fbbf24',
        'mist-blue': '#1e3a8a',
      },
      animation: {
        'mist-flow': 'mistFlow 15s ease-in-out infinite',
        'pulse-soul': 'pulseSoul 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'wave': 'wave 3s ease-in-out infinite',
        'ship-float': 'shipFloat 3s ease-in-out infinite',
        'ship-sail': 'shipSail 8s ease-in-out infinite',
      },
      keyframes: {
        mistFlow: {
          '0%, 100%': { opacity: '0.3', transform: 'translateX(0) translateY(0)' },
          '50%': { opacity: '0.5', transform: 'translateX(20px) translateY(-10px)' },
        },
        pulseSoul: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-20px)' },
        },
        shipFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%': { transform: 'translateY(-8px) rotate(1deg)' },
        },
        shipSail: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(30px)' },
          '75%': { transform: 'translateX(-30px)' },
        },
      },
    },
  },
  plugins: [],
}

